const fs = require('fs');

async function testOCR() {
  const filePath = 'C:\\Users\\Siva Raman S\\Downloads\\eb bill.webp';
  if (!fs.existsSync(filePath)) {
    console.error('File not found');
    return;
  }
  
  const fileBytes = fs.readFileSync(filePath);
  const base64Image = 'data:image/webp;base64,' + fileBytes.toString('base64');
  
  try {
    const res = await fetch('http://localhost:3000/api/test-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Image,
        mimeType: 'image/webp'
      })
    });
    
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}

testOCR();
