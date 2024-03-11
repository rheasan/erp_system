<# for reading db user credentials #>
Get-Content .env | ForEach-Object {
  $name, $value = $_.split('=')
  if ([string]::IsNullOrWhiteSpace($name) -or $name.Contains('#')) {
    continue
  }
  Set-Content env:\$name $value
}

Write-Output "Creating test db"
docker run --name test_db --volumes-from postgres -e POSTGRES_USER=$Env:ADMIN_USERNAME -e POSTGRES_PASSWORD=$Env:ADMIN_PASSWORD -e POSTGRES_DB=erp -p 5432:5432 -d postgres
