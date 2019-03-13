@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f fb2 -o %dir% -i %1 