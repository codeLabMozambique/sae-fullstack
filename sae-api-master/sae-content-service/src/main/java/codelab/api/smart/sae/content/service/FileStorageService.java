package codelab.api.smart.sae.content.service;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetObjectArgs;
import io.minio.RemoveObjectArgs;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    private final MinioClient minioClient;
    private final String bucketName;

    public FileStorageService(MinioClient minioClient, 
                               @Value("${smartsae.minio.bucket}") String bucketName) {
        this.minioClient = minioClient;
        this.bucketName = bucketName;
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
        } catch (Exception e) {
            logger.error("Erro ao verificar ou criar bucket no MinIO: {}", e.getMessage());
            throw new RuntimeException("Falha ao inicializar o bucket", e);
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
            logger.error("Erro ao salvar ficheiro no MinIO: {}", e.getMessage());
            throw new RuntimeException("Falha ao salvar ficheiro", e);
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
            logger.error("Erro ao salvar ficheiro no MinIO: {}", e.getMessage());
            throw new RuntimeException("Falha ao salvar ficheiro", e);
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
            logger.error("Erro ao ler ficheiro do MinIO: {}", e.getMessage());
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
            logger.error("Erro ao apagar ficheiro do MinIO: {}", e.getMessage());
        }
    }
}
