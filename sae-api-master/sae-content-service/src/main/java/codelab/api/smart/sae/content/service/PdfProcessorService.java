package codelab.api.smart.sae.content.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Service
public class PdfProcessorService {

    private static final Logger logger = LoggerFactory.getLogger(PdfProcessorService.class);

    public int getPageCount(byte[] fileBytes) {
        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(fileBytes))) {
            return document.getNumberOfPages();
        } catch (IOException e) {
            logger.error("Erro ao contar páginas do PDF: {}", e.getMessage());
            return 0;
        }
    }

    public byte[] generateThumbnail(byte[] fileBytes) {
        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(fileBytes))) {
            PDFRenderer pdfRenderer = new PDFRenderer(document);
            if (document.getNumberOfPages() > 0) {
                // Renderiza a primeira página (index 0) com 72 DPI (miniatura leve)
                BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 72);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(bim, "jpg", baos);
                return baos.toByteArray();
            }
        } catch (IOException e) {
            logger.error("Erro ao gerar thumbnail do PDF: {}", e.getMessage());
        }
        return null;
    }
}
