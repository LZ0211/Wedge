@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f db -o %dir% -i %1 