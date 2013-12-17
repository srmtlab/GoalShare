use utf8;
use Encode;
use LWP::UserAgent;
use Data::Dumper;
use URI::Escape;
use HTTP::Request::Common qw(POST);
use XML::LibXML;
use XML::Parser;
use XML::Simple;
use Data::Dumper;
use CGI;
use URI::Escape;
use open IN  => ":utf8";
use Time::HiRes qw(gettimeofday);
use JSON qw/encode_json decode_json/;
#use Net::Twitter::Lite;
use Time::Piece;
use DateTime;

$LOD_HOST = "masala.ics.nitech.ac.jp:3030";
#$LOD_HOST = "data.open-opinion.org";
$DATA_SET = "socia";

$LOD_PATH = "/${DATA_SET}/data/";

$LOD_GRAPH_BASE = "http://${LOD_HOST}/${DATA_SET}/data/";
$UPDATE_URL = "http://${LOD_HOST}/${DATA_SET}/update";
$QUERY_URL  = "http://${LOD_HOST}/${DATA_SET}/query";

$SOCIA_PREFIX  = "http://data.open-opinion.org/socia-ns#";
$SOCIA_DATA = "http://data.open-opinion.org/socia/data/";
$SOCIA_TAG = "${SOCIA_DATA}Tag/";

$SPARQL_PREFIX =
    "PREFIX socia: <${SOCIA_PREFIX}>\n". 
    "PREFIX dc: <http://purl.org/dc/terms/>\n".
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n".
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n".
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n".
    "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n".
    "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n";



sub get_content {
	my $url = $_[0];
	my $ua = LWP::UserAgent->new;
	my $req = HTTP::Request->new('GET', $url);
	$req->referer($referrer);
	$ua->agent($agent);
	my $response = $ua->request($req);
	my $ans = "";
	if ($response->is_success) {
		$ans = $response->content;
    }else{
		$ans = "failed";
    }
    return $ans;
    
}


sub up_content {
    my $url = $_[0];
    my $sparql = $_[1];
    my $ua = LWP::UserAgent->new;
    $ua->agent($agent);
#	my $req = HTTP::Request->new('POST', $url);
#	$req->content("output=json&update=$sparql");
#	$req->referer($referrer);
    my %formdata = ('update' => $sparql);
    my $req = POST($url, [%formdata]);
    my $response = $ua->request($req);
    my $ans = "";
#    my %hash = %$response;
#    foreach $key (keys(%hash)) {
#	print "$key: $hash{$key}<br>";
#    }
    if ($response->is_success) {
	$ans = $response->content;
    } else {
	$ans = '{"result":false}';
    }
    return $ans;
    
}

sub add_triple {
    my ($subject, $predicate, $object) = @_;
    my $add_pair = "<$subject> $predicate <$object>.\n";
    if ($object !~ /^http/) {
	$add_pair = "<$subject> $predicate '''$object'''.\n";
    }
    my $graph_uri = estimate_graph_uri($subject);
    my $sparql = $SPARQL_PREFIX .
	"INSERT DATA{\n".
	" GRAPH <$graph_uri> {\n".
	$add_pair .
	" }}\n";
    return up_content($UPDATE_URL, $sparql);
}

sub delete_triple {
    my ($subject, $predicate, $object) = @_;
    my $add_pair = "<$subject> $predicate <$object>.\n";
    if ($object !~ /^http/) {
	$add_pair = "<$subject> $predicate '''$object'''.\n";
    }
    my $graph_uri = estimate_graph_uri($subject);
    my $sparql = $SPARQL_PREFIX .
	"DELETE WHERE {\n".
	" GRAPH <$graph_uri> {\n".
	$add_pair .
	" }}\n";
    
    return up_content($UPDATE_URL, $sparql);
}


sub graph_contains_uri {
    my ($graph_uri, $id) = @_;
    my $sparql = 
	"SELECT * WHERE{".
	" GRAPH <$graph_uri> { <$id> ?p ?o .}}";
    my $qurl = "${QUERY_URL}?query=" . uri_escape_utf8($sparql) . "&output=xml";
    my $xml_l = get_content($qurl);
    my $doc_l = XML::LibXML->new->parse_string($xml_l);
    my @results = $doc_l->getElementsByTagName('result');
    return @results;
}

sub get_properties {
    my $content_id = $_[0];
    my $prop = $_[1];
    my $var = $_[2];
    my $add_pair = "<$content_id> $prop $var.";
    my $graph_uri = estimate_graph_uri($content_id);

    my $sparql = $SPARQL_PREFIX .
 	"SELECT * WHERE{".
	" GRAPH <$graph_uri> {".
	$add_pair .
	" }}";

    my $qurl = "${QUERY_URL}?query=" . uri_escape_utf8($sparql) . "&output=xml";

    my $xml_l = get_content($qurl);

    my $doc_l = XML::LibXML->new->parse_string($xml_l);
    my @results = $doc_l->getElementsByTagName('result');
    return @results;

}

sub get_property {
    my $content_id = $_[0];
    my $prop = $_[1];
    my @results = get_properties($content_id, $prop, "?o");
    foreach my $result ( @results ){
	my @bindings = $result->getElementsByTagName('binding');
	foreach my $binding (@bindings) {
	    my $name = $binding->getAttribute('name');
	    if ($name eq "o") {
		return trim($binding->textContent);
	    }
	}
    }
}

sub add_link {
    my ($content_id, $property, $link_id) = @_;
    my $result1 = add_triple($content_id, $property, $link_id);
    
    my $result2 = "success";
    if ($property eq "dc:references") {
	$result2 = add_triple($link_id, "dc:isReferencedBy", $content_id);
    }
    if ($property eq "socia:inReplyTo") {
	$result2 = add_triple($link_id, "socia:isRepliedBy", $content_id);
    }
    if ($property eq "socia:related") {
	$result2 = add_triple($link_id, "socia:related", $content_id);
    }
    
    my $ans = "true";
    if( $result1 !~ /success/im || $result2 !~ /success/im ){
	$ans = "false";
    }
    return $ans;
}


sub trim {
    my $val = shift;
    $val =~ s/^[\n|\s]*//;
    $val =~ s/[\s|\n]*$//;
    return $val;
}


sub get_millisec {
    my ($sec,$microsec) = gettimeofday();
    my $millisec = $sec * 1000 + int($microsec / 1000);
    return $millisec;
}


sub estimate_graph_uri {
    my $uri = $_[0];
    if ($uri =~ /^(http:\/\/[^\/].+\/socia\/data\/\w+)/) {
	return $1;
    } elsif ($uri =~ /^http:\/\/twitter/) {
	return "${LOD_GRAPH_BASE}MicroPost";
    } elsif ($uri =~ /^http:\/\/\w+\.wikipedia\.org/) {
	return "${LOD_GRAPH_BASE}WikipediaArticle";
    } elsif (graph_contains_uri("${LOD_GRAPH_BASE}NewsArticle", $uri)) {
	return "${LOD_GRAPH_BASE}NewsArticle";
    } elsif (graph_contains_uri("${LOD_GRAPH_BASE}BlogArticle", $uri)) {
	return "${LOD_GRAPH_BASE}BlogArticle";
    }
    return "${LOD_GRAPH_BASE}WebContent";
}


sub is_event {
    my $graph_uri = estimate_graph_uri($_[0]);
    if ($graph_uri =~ /\/Event$/) {
	return 1;
    } else {
	return 0;
    }
}

sub is_news_article {
    my $graph_uri = estimate_graph_uri($_[0]);
    if ($graph_uri =~ /\/NewsArticle$/) {
	return 1;
    } else {
	return 0;
    }
}

sub is_wikipedia {
    my $graph_uri = estimate_graph_uri($_[0]);
    if ($graph_uri =~ /\/WikipediaArticle$/) {
	return 1;
    } else {
	return 0;
    }
}


sub is_tweet {
    my $graph_uri = estimate_graph_uri($_[0]);
    if ($graph_uri =~ /\/MicroPost$/) {
	return 1;
    } else {
	return 0;
    }
}


sub search_wikipedia {
    my $text = $_[0];

    my $encoded = uri_escape($text);
    my $qurl = "http://search.yahoo.co.jp/search?p=site%3Aja.wikipedia.org+$encoded&ei=UTF-8";
    my $html = get_content($qurl);
    
    my $wiki_url;
    if ($html =~ /<ol><li><a href="(.+?)"/s) {
	$wiki_url = $1;
    }
    
    my $title;
    if ($wiki_url) {
	$title = uri_unescape($wiki_url);
	$title =~ s/^http:.+\///;
	add_triple(uri_unescape($wiki_url), "rdf:type", "socia:WikipediaArticle");
	add_triple(uri_unescape($wiki_url), "dc:title", $title);
	return ($wiki_url, $title);
    }
}

sub current_date_time {
    my $tzhere = DateTime::TimeZone->new( name => "Asia/Tokyo" );
    my $dt = DateTime->now(time_zone => $tzhere);
    return $dt->strftime('%Y-%m-%dT%H:%M:%S');
}

sub debug_msg {
    my $msg = $_[0];
    open(OUT, ">>/home/siramatu/public_html/plan/debug.txt");
    print OUT "$msg\n-------\n";
    close(OUT);
}

