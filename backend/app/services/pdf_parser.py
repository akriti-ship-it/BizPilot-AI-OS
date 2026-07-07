import fitz  # PyMuPDF

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file using PyMuPDF (fitz).
    It parses layouts and extracts plain text content accurately.
    """
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            page_text = page.get_text()
            if page_text:
                text += page_text + "\n"
        doc.close()
        return text
    except Exception as e:
        print(f"Error extracting text from PDF using PyMuPDF: {e}")
        return ""
