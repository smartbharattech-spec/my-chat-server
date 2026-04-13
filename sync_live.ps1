param (
    [string[]]$Files,
    [string]$LocalBase = "c:\xampp\htdocs\myvastutool"
)

$FTP_HOST = "82.180.142.181"
$FTP_USER = "u737940041.myvastutool.com"
$FTP_PASS = "/:V/HzB24Sex7b!P"
$REMOTE_BASE = ""
$LOCAL_BASE = $LocalBase

foreach ($file in $Files) {
    if ($file -eq "dist") {
        # Upload dist contents to root
        $distPath = Join-Path $LOCAL_BASE "dist"
        $filesInDir = Get-ChildItem -Path $distPath -Recurse -File
        foreach ($f in $filesInDir) {
            $localPath = $f.FullName
            $relativePath = $f.FullName.Substring($distPath.Length + 1)
            $remotePath = $relativePath -replace '\\', '/'
            & curl.exe --ftp-create-dirs -u "$($FTP_USER):$($FTP_PASS)" -T "$localPath" "ftp://$FTP_HOST/$remotePath"
        }
    } else {
        $fullPath = if ([System.IO.Path]::IsPathRooted($file)) { $file } else { Join-Path $LOCAL_BASE $file }
        if (Test-Path $fullPath -PathType Container) {
            $filesInDir = Get-ChildItem -Path $fullPath -Recurse -File
            foreach ($f in $filesInDir) {
                $localPath = $f.FullName
                $relativePath = $f.FullName.Substring($LOCAL_BASE.Length + 1)
                $remotePath = $relativePath -replace '\\', '/'
                & curl.exe --ftp-create-dirs -u "$($FTP_USER):$($FTP_PASS)" -T "$localPath" "ftp://$FTP_HOST/$remotePath"
            }
        } else {
            $localPath = $fullPath
            $relativePath = $file -replace '\\', '/'
            & curl.exe --ftp-create-dirs -u "$($FTP_USER):$($FTP_PASS)" -T "$localPath" "ftp://$FTP_HOST/$relativePath"
        }
    }
}
