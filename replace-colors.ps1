$files = Get-ChildItem -Path 'c:\Users\harish\Documents\Proj_Docs\client\src\features' -Recurse -Filter '*.tsx'
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $updated = $content `
        -replace 'from-amber-400 to-amber-600', 'from-violet-500 to-violet-600' `
        -replace 'from-amber-500 to-amber-600', 'from-violet-600 to-violet-700' `
        -replace 'hover:from-amber-600 hover:to-amber-700', 'hover:from-violet-700 hover:to-violet-800' `
        -replace 'from-amber-600 to-amber-700', 'from-violet-700 to-violet-800' `
        -replace 'shadow-amber-500/20', 'shadow-violet-500/20' `
        -replace 'shadow-amber-500/25', 'shadow-violet-500/20' `
        -replace 'text-amber-400', 'text-violet-400' `
        -replace 'text-amber-500', 'text-violet-500' `
        -replace 'text-amber-600', 'text-violet-600' `
        -replace 'text-amber-500/70', 'text-slate-400' `
        -replace 'text-amber-500/60', 'text-slate-400' `
        -replace 'bg-amber-500/10', 'bg-violet-50' `
        -replace 'bg-amber-500/20', 'bg-violet-100' `
        -replace 'border-amber-500/20', 'border-violet-200' `
        -replace 'bg-amber-50', 'bg-violet-50' `
        -replace 'border-amber-200', 'border-violet-200' `
        -replace 'text-amber-700', 'text-violet-700' `
        -replace 'bg-amber-500', 'bg-violet-600' `
        -replace 'hover:bg-amber-400', 'hover:bg-violet-500' `
        -replace 'hover:bg-amber-600', 'hover:bg-violet-700' `
        -replace 'border-amber-400/60', 'border-violet-400' `
        -replace 'border-amber-400', 'border-violet-400' `
        -replace 'bg-amber-400/10', 'bg-violet-50' `
        -replace 'bg-amber-400', 'bg-violet-500' `
        -replace 'hover:text-amber-300', 'hover:text-violet-300' `
        -replace 'bg-amber-100', 'bg-violet-100' `
        -replace 'text-amber-800', 'text-violet-800' `
        -replace 'border-amber-300', 'border-violet-300'
    if ($updated -ne $content) {
        Set-Content $f.FullName $updated -NoNewline -Encoding UTF8
        Write-Host "Updated: $($f.Name)"
    }
}
