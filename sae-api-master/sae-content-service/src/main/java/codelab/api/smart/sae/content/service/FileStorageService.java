package codelab.api.smart.sae.content.service;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetObjectArgs;
import io.minio.RemoveObjectArgs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    private final MinioClient minioClient;
    private final String bucketName;
    private final String localFallbackDir;

    public FileStorageService(MinioClient minioClient, 
                               @Value("${smartsae.minio.bucket}") String bucketName) {
        this.minioClient = minioClient;
        this.bucketName = bucketName;
        this.localFallbackDir = System.getProperty("java.io.tmpdir") + File.separator + "sae-uploads";
        
        try {
            File fallbackDir = new File(this.localFallbackDir);
            if (!fallbackDir.exists()) {
                fallbackDir.mkdirs();
            }
            
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
        } catch (Exception e) {
            logger.warn("Erro ao inicializar o bucket MinIO. O sistema usará o fallback local em: {}", this.localFallbackDir);
        }
    }

    public String saveFile(MultipartFile file) {
        try {
            return saveFile(file.getBytes(), file.getOriginalFilename(), file.getContentType());
        } catch (Exception e) {
            throw new RuntimeException("Falha ao ler bytes do MultipartFile", e);
        }
    }

    public String saveFile(byte[] fileBytes, String originalName, String contentType) {
        String fileName = UUID.randomUUID().toString() + "_" + originalName;
        try {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(fileName)
                    .stream(new java.io.ByteArrayInputStream(fileBytes), fileBytes.length, -1)
                    .contentType(contentType)
                    .build()
            );
            return fileName;
        } catch (Exception e) {
            logger.warn("Erro ao salvar ficheiro no MinIO: {}. Tentando fallback local...", e.getMessage());
            try {
                Path path = Paths.get(this.localFallbackDir, fileName);
                Files.createDirectories(path.getParent());
                Files.write(path, fileBytes);
                return fileName;
            } catch (Exception ex) {
                logger.error("Erro ao salvar ficheiro localmente: {}", ex.getMessage());
                throw new RuntimeException("Falha ao salvar ficheiro", ex);
            }
        }
    }

    public void saveFileWithKey(byte[] fileBytes, String key, String contentType) {
        try {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(key)
                    .stream(new java.io.ByteArrayInputStream(fileBytes), fileBytes.length, -1)
                    .contentType(contentType)
                    .build()
            );
        } catch (Exception e) {
            logger.warn("Erro ao salvar ficheiro no MinIO: {}. Tentando fallback local...", e.getMessage());
            try {
                Path path = Paths.get(this.localFallbackDir, key);
                Files.createDirectories(path.getParent());
                Files.write(path, fileBytes);
            } catch (Exception ex) {
                logger.error("Erro ao salvar ficheiro localmente: {}", ex.getMessage());
                throw new RuntimeException("Falha ao salvar ficheiro", ex);
            }
        }
    }

    public InputStream getFile(String fileName) {
        try {
            return minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(fileName)
                    .build()
            );
        } catch (Exception e) {
            logger.warn("Erro ao ler ficheiro do MinIO: {}. Tentando fallback local...", e.getMessage());
            try {
                File file = new File(this.localFallbackDir, fileName);
                if (file.exists()) {
                    return new FileInputStream(file);
                }
            } catch (Exception ex) {
                // ignore and fall through to throw
            }
            throw new RuntimeException("Ficheiro não encontrado", e);
        }
    }

    public byte[] getFileBytes(String fileName) {
        try (InputStream is = getFile(fileName)) {
            return is.readAllBytes();
        } catch (Exception e) {
            logger.error("Erro ao ler bytes do MinIO: {}", e.getMessage());
            throw new RuntimeException("Falha ao ler ficheiro", e);
        }
    }

    public void deleteFile(String fileName) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(fileName)
                    .build()
            );
        } catch (Exception e) {
            logger.warn("Erro ao apagar ficheiro do MinIO: {}. Tentando fallback local...", e.getMessage());
            try {
                File file = new File(this.localFallbackDir, fileName);
                if (file.exists()) {
                    file.delete();
                }
            } catch (Exception ex) {
                // ignore
            }
        }
    }
}
