@ECHO OFF
pushd %~dp0
node cli -f json -i %1 -o %~dp0