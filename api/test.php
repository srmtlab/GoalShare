<?php 
//header('Access-Control-Allow-Origin: *');
header('Cache-Control: public'); 
header('Expires: '.gmdate('D, d M Y H:i:s', time()+50).' GMT');
sleep(10);
print "fgwefwefwe";
 $endpoint = "http://geolod.ex.nii.ac.jp/resource/EqBQEA";
  $header  = array("Content-Type: application/json", "accept:application/xml");
  $options = array('http' => array('method' => 'GET', 'header' => implode("\r\n", $header)));
  $context = stream_context_create($options);
  $content = file_get_contents("http://geolod.ex.nii.ac.jp/resource/EqBQEA", false, $context);
  echo $content;
  $result = json_decode($content, true);
  echo $result;
print "Ok";

?>