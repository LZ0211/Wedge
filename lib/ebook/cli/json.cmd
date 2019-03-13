@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f json -o %dir% -i %1 