@ECHO OFF
pushd %~dp0
node cli -f epub -i %1 -o %~dp0