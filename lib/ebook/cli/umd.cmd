@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f umd -o %dir% -i %1 