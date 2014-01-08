use utf8;
use Encode;
use URI::Escape;
use JSON qw/encode_json decode_json/;
use CGI;
use HTTP::Request::Common;
use LWP::UserAgent;
use URI;
use DBI;
use Try::Tiny;

require("debug_log.pl");
my $endpoint_auth = URI->new("http://collab.open-opinion.org/sparql-auth");
my $endpoint = URI->new("http://collab.open-opinion.org/sparql");
#my $endpoint = URI->new("http://collab.open-opinion.org/sparql-auth");

$SPARQL_PREFIX = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n". 
    "PREFIX dc: <http://purl.org/dc/terms/>\n".
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n".
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n".
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n".
    "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n".
    "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n";
my $username = 'socia';
my $password = 'publicconcerns';

sub execute_sparul {
    my $sparql = $_[0];
    my $graph_uri = $_[1];
    
    my $uri = URI->new($endpoint_auth);
    $uri->query_form(
	"query" => $sparql, 
	"format" => "application/sparql-results+json",
	"default-graph-uri" => $graph_uri,
	"timeout" => 0,
	"debug" => "on");

    my $url = $uri->as_string;
    my $wget_cmd = "wget -O - --header=\"Accept: text/html,application/sparql-results+json\" --http-user=socia --http-passwd=publicconcerns \"$url\"";
    #print "$wget_cmd\n";
    #my $response = `$wget_cmd`;
    my $response = makeAuthRequest($url);
    if ($response) {
	return $response;
    } else {
	return '{"results":{}}';
    }

}


sub execute_sparql {
    my $sparql = $_[0];
    my $graph_uri = $_[1];
    
    my $uri = URI->new($endpoint);
    $uri->query_form(
	"query" => $sparql, 
	"format" => "application/sparql-results+json",
	"default-graph-uri" => $graph_uri,
	"timeout" => 0,
	"debug" => "on");

    my $url = $uri->as_string;
    my $wget_cmd = "wget -O - --header=\"Accept: text/html,application/sparql-results+json\"  --http-user=socia --http-passwd=publicconcerns \"$url\"";
    #print "$wget_cmd\n";
    #my $response = `$wget_cmd`;
    my $response = makeRequest($url);
    if ($response) {
	return $response;
    } else {
	return '{"results":{}}';
    }

}

sub get_bindings {
    my $sparql = $_[0];
    my $graph_uri = $_[1];
    my $json = execute_sparql($sparql, $graph_uri);
    #print "[debug] $json\n";
    my $ret = decode_json($json);
    #print "++++", $ret->{"results"}->{"bindings"}, "\n";
    return $ret->{"results"}->{"bindings"};

}


	
sub makeAuthRequest{
	my $url = $_[0];	
	#my $browser = LWP::UserAgent->new('Mozilla');
	my $browser = LWP::UserAgent->new;
	$browser->credentials("collab.open-opinion.org:80","SPARQL",$username=>$password);
	try{
		my $response = $browser->get($url);
		if ($response->is_success) {
			logHttpRequest("Auth", $url, $response->decoded_content, "OK");
			return $response->decoded_content;
		}else{
			logHttpRequest("Auth", $url, $response->decoded_content, "Error");
		}
	}catch{
		logHttpRequest("Auth", $url, "", "Connection");
	}
}
sub makeRequest{
	my $url = $_[0];
	
	
	#my $browser = LWP::UserAgent->new('Mozilla');
	my $browser = LWP::UserAgent->new;
	$browser->credentials("collab.open-opinion.org:80","SPARQL",$username=>$password);
	try{
		my $response = $browser->get($url);
		if ($response->is_success) {
			logHttpRequest("Open", $url, $response->decoded_content, "OK");
			return $response->decoded_content;
		}else{
			logHttpRequest("Open", $url, $response->decoded_content, "Error");
		}
	}catch{
		logHttpRequest("Open", $url, "", "Connection");
	}
}
