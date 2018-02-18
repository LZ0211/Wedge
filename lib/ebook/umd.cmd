@ECHO OFF
pushd %~dp0
node cli -f umd -i %1 -o %~dp0