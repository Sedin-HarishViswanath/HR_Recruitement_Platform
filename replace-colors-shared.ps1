$files = Get-ChildItem -Path 'c:\Users\harish\Documents\Proj_Docs\client\src\shared' -Recurse -Filter '*.tsx'
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $updated = $content `
        -replace 'from-amber-400 to-amber-600', 'from-violet-500 to-violet-600' `
        -replace 'from-amber-500 to-amber-600', 'from-violet-600 to-violet-700' `
        -replace 'shadow-amber-500/20', 'shadow-violet-500/20' `
        -replace 'text-amber-600', 'text-violet-600' `
        -replace 'bg-amber-500', 'bg-violet-600' `
        -replace 'bg-amber-50', 'bg-violet-50' `
        -replace 'text-amber-700', 'text-violet-700' `
        -replace 'border-amber-200', 'border-violet-200'
    if ($updated -ne $content) {
        Set-Content $f.FullName $updated -NoNewline -Encoding UTF8
        Write-Host "Updated: $($f.Name)"
    }
}
