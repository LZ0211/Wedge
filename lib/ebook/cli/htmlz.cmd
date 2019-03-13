@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f htmlz -o %dir% -i %1 