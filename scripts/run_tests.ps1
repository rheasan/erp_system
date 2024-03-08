$script_dir = Get-Location
function reset_loc {
	Set-Location $script_dir
}

Invoke-WebRequest -Uri $Env:LOCAL_BACKEND_SERVER_URL > $tmp
if (!$?) {
	Write-Output "Server is not running.."
	exit
}

Write-Output "Running server unit tests"
Set-Location ..\backend\server
cargo test
<# $? returns true or false not the exit code #>
if (!$?) {
	reset_loc
	exit
}


reset_loc
Write-Output "Running Api tests"
Set-Location ./api_tests
npm run test
if(!$?) {
	reset_loc
	exit
}

reset_loc