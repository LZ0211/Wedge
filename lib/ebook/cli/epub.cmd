@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f epub -o %dir% -i %1 