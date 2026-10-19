cd $HOME\Downloads
$f = (Get-ChildItem *1011*.exe | Select-Object -First 1).FullName
$b = [IO.File]::ReadAllBytes($f)
$a = [Text.Encoding]::ASCII.GetString($b)
$u = [Text.Encoding]::Unicode.GetString($b)
$s = @(($a -split '[^\x20-\x7E]{3,}') + ($u -split '[^\x20-\x7E]{3,}')) | Where-Object Length -ge 5
$s | Set-Content .\strings.txt -Encoding UTF8
"FILE: $f"
"STRINGS: $($s.Count)"
$s | Select-String -Pattern useruser,password,passwd,pwd,secret,admin,sqlite,insert,login,token | Select-Object -First 60
