# MICRONAUT ORCHESTRATOR (SCO/1 projection only)
# Sovereign semantic object — speaks only through files, reasons only through law.
# PowerShell never reasons. It routes.

Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$IO = Join-Path $Root "io"
$Chat = Join-Path $IO "chat.txt"
$Stream = Join-Path $IO "stream.txt"
$Snapshot = Join-Path $IO "snapshot"

# Ensure IO paths exist
if (-not (Test-Path $IO)) { New-Item -ItemType Directory -Path $IO | Out-Null }
if (-not (Test-Path $Snapshot)) { New-Item -ItemType Directory -Path $Snapshot | Out-Null }

# ── Lifecycle: INIT ──────────────────────────────────────────────

$State = "INIT"

function Set-State {
    param([string]$Next)
    $valid = @{
        "INIT"    = @("READY")
        "READY"   = @("RUNNING")
        "RUNNING" = @("IDLE", "HALT")
        "IDLE"    = @("RUNNING", "HALT")
        "HALT"    = @()
    }
    if ($valid[$script:State] -contains $Next) {
        $script:State = $Next
    } else {
        Write-Host "Illegal transition: $($script:State) -> $Next"
        $script:State = "HALT"
    }
}

# ── CM-1 Verification ───────────────────────────────────────────

function Invoke-CM1Verify {
    param(
        [Parameter(Mandatory)]
        [string]$Entry
    )

    # Reject forbidden control characters (U+001B ESC = ILLEGAL)
    if ($Entry -match '\x1B') { return "ILLEGAL" }

    # Reject unbalanced scope markers (SO without matching SI)
    if ($Entry -match '\x0E' -and $Entry -notmatch '\x0F') { return "FAIL" }

    # Reject unterminated DLE sequences
    if ($Entry -match '\x10' -and $Entry -notmatch '\x11') { return "FAIL" }

    # Valid structured message format
    if ($Entry -match '--- MESSAGE ---' -and $Entry -match '--- END ---') { return "PASS" }

    # Plain text without control chars passes
    if ($Entry -notmatch '[\x00-\x1F]') { return "PASS" }

    return "FAIL"
}

# ── KUHUL-TSG Semantic Extraction ────────────────────────────────

function Invoke-KUHUL-TSG {
    param(
        [Parameter(Mandatory)]
        [string]$Input
    )

    # TSG: Text -> Geometry -> Signal
    # Extract structured fields from message format
    $signal = @{
        raw = $Input
        tokens = ($Input -split '\s+').Count
        timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    }

    # Extract intent if present in message format
    if ($Input -match 'intent:\s*(\S+)') {
        $signal.intent = $Matches[1]
    }

    # Extract payload if present
    if ($Input -match '(?s)payload:\s*\n(.+?)(?:\n--- END ---|\z)') {
        $signal.payload = $Matches[1].Trim()
    }

    return $signal
}

# ── SCXQ2 Inference (Sealed Object) ─────────────────────────────

function Invoke-SCXQ2-Infer {
    param(
        [Parameter(Mandatory)]
        $Signal
    )

    # Projection only: sealed object inference emits stream payloads.
    # Geometry decides. Inference is collapse, not generation.
    $mass = [math]::Round(1.0 / [math]::Max(1, $Signal.tokens), 4)
    $ctx = if ($Signal.intent) { $Signal.intent } else { "@pi" }
    $t = $Signal.timestamp

    return "t=$t ctx=$ctx mass=$mass"
}

# ── Snapshot Rotation ────────────────────────────────────────────

function Save-Snapshot {
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $snapFile = Join-Path $Snapshot "$ts.snap"

    $snapData = @{
        state = $script:State
        timestamp = $ts
        chat_size = if (Test-Path $Chat) { (Get-Item $Chat).Length } else { 0 }
        stream_size = if (Test-Path $Stream) { (Get-Item $Stream).Length } else { 0 }
    }

    $snapData | ConvertTo-Json | Set-Content $snapFile
}

# ── Main Loop ────────────────────────────────────────────────────

Write-Host "Micronaut online."
Set-State "READY"
Set-State "RUNNING"

$lastSize = 0

while ($State -ne "HALT") {
    if (Test-Path $Chat) {
        $size = (Get-Item $Chat).Length
        if ($size -gt $lastSize) {
            Set-State "RUNNING"

            $entry = Get-Content $Chat -Raw
            $lastSize = $size

            # ── CM-1 VERIFY ──
            $cm1 = Invoke-CM1Verify -Entry $entry
            if ($cm1 -ne "PASS") {
                Write-Host "CM-1 $cm1"
                Add-Content $Stream ">> @cm1=$cm1"
                continue
            }

            # ── SEMANTIC EXTRACTION ──
            $signal = Invoke-KUHUL-TSG -Input $entry

            # ── INFERENCE (SEALED) ──
            $response = Invoke-SCXQ2-Infer -Signal $signal

            # ── STREAM OUTPUT ──
            Add-Content $Stream ">> $response"

            Set-State "IDLE"
        }
    }

    Start-Sleep -Milliseconds 200
}

# ── Seal trace on halt ───────────────────────────────────────────
Save-Snapshot
Write-Host "Micronaut halted. Trace sealed."
