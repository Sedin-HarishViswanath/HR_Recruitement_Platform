$files = Get-ChildItem -Path 'c:\Users\harish\Documents\Proj_Docs\client\src' -Recurse -Filter '*.tsx'
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $updated = $content -replace '#f4f5f7', '#fafbfc' -replace '#0f172a', '#1e293b'
    if ($updated -ne $content) {
        Set-Content $f.FullName $updated -NoNewline -Encoding UTF8
        Write-Host "Updated: $($f.Name)"
    }
}
