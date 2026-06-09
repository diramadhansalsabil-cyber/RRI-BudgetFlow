export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function filesToBase64List(fileList) {
  const files = Array.from(fileList || []);
  return Promise.all(files.map(fileToBase64));
}
