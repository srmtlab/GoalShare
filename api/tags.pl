#!/usr/bin/perl

use JSON;
use Try::Tiny;

require("sparql.pl");
require("goal_backend.pl");

use Data::Dumper;


my $q = CGI->new;
my @params = $q->param();

my $command = uri_unescape( $q->param('command') );
my $goalURI = uri_unescape( $q->param('goalURI') );
my $tagURI = uri_unescape( $q->param('tagURI') );
my $parentTagURI = uri_unescape( $q->param('parentTagURI') );
print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
my $result;# = {};


if ($command eq "addGoalTag"){
	$result = addGoalTag($goalURI, $tagURI);		
}
if ($command eq "removeGoalTag"){
	$result = removeGoalTag($goalURI, $tagURI);	
}
if ($command eq "clearGoalTags"){
	
	$result = clearGoalTags($goalURI);	
}
if ($command eq "getTags"){
	$result = getTags();
}
if ($command eq "getGoalTags"){
	$result = {};
	
	my $res1 = getGoalTags($goalURI);
	$result->{tags}= $res1->{tags};
	#$result = getGTTags($goalURI);
	#print Dumper $result;
	my $res2 = getGTTags($goalURI); 
	#print Dumper $res2;
	#
	$result->{treeTags} = $res2->{tags};
}
if ($command eq "getTagById"){
	$result = getTagById($tagURI);
}
if ($command eq "getSubTagsById"){
	$result = getSubTagsById($tagURI);
}

if ($command eq "createAndAddTag"){
	$result = createTag($tagURI);
	$result->{addRes} = addGoalTag($goalURI, $result->{tagURI});

}

if ($command eq "createTag"){
	$result = createTag($tagURI);
}

if ($command eq "linkTag"){
	$result = linkTag($tagURI, $parentTagURI);
}
if ($command eq "unlinkTag"){
	$result = unlinkTag($tagURI, $parentTagURI);
}
if ($command eq "test"){
	$resdddult = getGTTags($goalURI);
}
my $js = new JSON;
print $js->pretty->encode( \%$result );

exit;
# END