#!/usr/bin/perl -w
use CGI;
use JSON;

#$jtest = "{\"a\": \"a1\", \"b\":\"b2\", \"c\": [\"cc1\", \"cc2\", \"cc3\" ] }";


my $q = CGI->new;
@params = $q->param();
print "Content-type: text/html\r\n\r\n";

print "Testing JSON lib" . "<br/>";
#$json = decode_json  $jtest;

print "a: " . $json["a"] . "<br/>";
print "b: " . $json["b"] . "<br/>";
print "b: " . $json["c"] . "<br/>";

print "Testing for params..." . "<br/>";
for(@params)
{
	print "Param: " . $_ . "<br/>";

}



print "Hello there!<br/>";
for ($i = 0; $i<100; $i++)
{
	print $i . "<br/>";
}
