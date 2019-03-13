@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f epub2 -o %dir% -i %1 