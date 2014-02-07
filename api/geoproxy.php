<?php

$apikey = "cb55f790-2266-4315-ae6d-4932b0d4acef"; // <- input your API key

function jsonrpc_exec2($json_request) {
  $endpoint = "https://Dias.Ex.Nii.Ac.Jp/geonlp/api/1/geo-tagging";
  $query = json_encode($json_request);
  $header  = array("Content-Type: application/x-www-form-urlencoded",
                   "X-GeoNLP-Authorization: {$apikey}",
                   "Content-Length: ".strlen($query));
  $options = array('http' => array('method' => 'POST', 'header' => implode("\r\n", $header), 'content' => $query));
  $content = file_get_contents($endpoint, false, stream_context_create($options));
  $result = json_decode($content, true);
  return $result;
}

function jsonrpc_exec($json_request) {
  global $apikey;
  if ($apikey =='') throw new Exception ("Please submit the API key from the GeoNLP site (https://geonlp.ex.nii.ac.jp)");

  $Endpoint = "https://dias.ex.nii.ac.jp/geonlp/api/1/geo-tagging";
  $Header = array ("Content-Type: application/json",
                   "X-GeoNLP-Authorization: {$apikey}",
                    "Content-Length:". strlen ($json_request));
  $Options = array ('http' => array ('method' => 'POST', 'header' => implode ("\r\n", $Header), 'content' => $json_request));
  $Content = file_get_contents ($Endpoint, false, stream_context_create($Options));
  $Result = json_decode (html_entity_decode( $Content ), true);
  return $Result;
}


// $Request = array (
//   'Method' => 'geonlp.getDictionaryInfo',
//   'Params' => array (array (28, 29)),
//   'Id' => 6);
//"名古屋市"
$result = "";
if( $_GET["command"] == "search" ){
	$Request = array (  'method' => 'geonlp.search' ,  'params' => array ( $_GET["param"] ),  'id' => 3 );
	$Result = jsonrpc_exec(json_encode($Request));
	//print_r (html_entity_decode(json_encode( $Result) ));
}elseif( $_GET["command"] == "parse" ){
	
	$Request = array (  'method' => 'geonlp.parse' ,  'params' => array ( $_GET["param"], array(  'geocoding'=> true ,  'threshold'=> 0  )  ),  'id' => 3 );
	$Result = jsonrpc_exec(json_encode($Request));
	//print_r (html_entity_decode(json_encode( $Result) ));
}elseif( $_GET["command"] == "get" ){
	$Request = array (  'method' => 'geonlp.getGeoInfo' ,  'params' => array ( $_GET["param"]), 'id' => 3 );
	$Result = jsonrpc_exec(json_encode($Request));
	//fwrite(STDERR, "Get loc\n");
}
	//header(‘Expires: ‘.gmdate(‘D, d M Y H:i:s’, time()+50000).’GMT’););
	print_r (json_encode( $Result) );

//print ($jsonrpc_exec($test));
?>