@ECHO OFF
pushd %~dp0
node cli -f db -i %1 -o %~dp0