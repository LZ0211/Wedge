@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f txtz -o %dir% -i %1 