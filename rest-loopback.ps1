# rest-loopback.ps1
$Root = Split-Path $MyInvocation.MyCommand.Path
$IO = Join-Path $Root "io"
$Chat = Join-Path $IO "chat.txt"
$Stream = Join-Path $IO "stream.txt"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:7777/")
$listener.Start()
Write-Host "Loopback REST online @ 127.0.0.1:7777"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response

  switch ($req.Url.AbsolutePath) {
    "/chat" {
      if ($req.HttpMethod -ne "POST") { break }
      $body = New-Object IO.StreamReader($req.InputStream).ReadToEnd()
      Add-Content $Chat $body
      $res.StatusCode = 202
    }
    "/stream" {
      $text = (Test-Path $Stream) ? (Get-Content $Stream -Raw) : ""
      $buf = [Text.Encoding]::UTF8.GetBytes($text)
      $res.OutputStream.Write($buf,0,$buf.Length)
      $res.StatusCode = 200
    }
    default { $res.StatusCode = 404 }
  }

  $res.Close()
}
