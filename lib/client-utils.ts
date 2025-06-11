export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function getFileIcon(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase() || ""
    
    if (["pdf"].includes(extension)) {
        return "pdf"
    } else if (["doc", "docx", "txt"].includes(extension)) {
        return "doc"
    } else if (["xls", "xlsx", "csv"].includes(extension)) {
        return "xls"
    } else if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
        return "img"
    } else if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
        return "zip"
    }
    
    return "default"
}

export function validatePassphrase(passphrase: string): { isValid: boolean; error?: string } {
    if (passphrase.length < 8) {
        return { isValid: false, error: "Passphrase must be at least 8 characters" }
    }
    
    if (!/[a-z]/.test(passphrase)) {
        return { isValid: false, error: "Passphrase must include lowercase letters" }
    }
    
    if (!/[A-Z]/.test(passphrase)) {
        return { isValid: false, error: "Passphrase must include uppercase letters" }
    }
    
    if (!/[0-9]/.test(passphrase)) {
        return { isValid: false, error: "Passphrase must include numbers" }
    }
    
    if (!/[^a-zA-Z0-9]/.test(passphrase)) {
        return { isValid: false, error: "Passphrase must include special characters" }
    }
    
    return { isValid: true }
} 