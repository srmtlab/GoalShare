#!/usr/bin/perl -w
use JSON;

$jtest = "{\"a\": \"a1\", \"b\":\"b2\", \"c\": [\"cc1\", \"cc2\", \"cc3\" ] }";


print "Content-type: text/html\r\n\r\n";

print "Testing JSON lib" . "<br/>";
$json = decode_json ($jtest); 
print "a: " . $json->{a} . "<br/>";
print "b: " . $json->{b} . "<br/>";
print "c: " . $json->{c} . "<br/>";

print "c1: " . $json->{c}[0] . "<br/>";

print "c2: " . $json->{c}[1] . "<br/>";

$i = scalar @{$json->{c}};
print "i: " . $i;

for($i=0; $i< 10 && $i < scalar @{$json->{c}}; $i++){
	print "<br/> c".$i . ": " . $json->{c}[$i]; 
}
