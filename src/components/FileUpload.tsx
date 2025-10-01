import React, { useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  acceptedTypes = '.ifc' 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button 
        onClick={handleClick}
        className="upload-button"
      >
        📁 Выбрать IFC файл
      </button>
      <p className="upload-hint">
        Поддерживаемые форматы: .ifc (IFC файлы)
      </p>
    </div>
  );
};

export default FileUpload;
