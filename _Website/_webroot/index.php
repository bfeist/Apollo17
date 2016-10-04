<?php

define('APP_ROOT', dirname(__FILE__) . '/');
define('WEB_ROOT', explode('?', $_SERVER['REQUEST_URI'], 2));

?>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Welcome to Mobiletown - population: Apollo 17 -->
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <link rel="copyright" href="http://creativecommons.org/licenses/by-nc-sa/3.0/" />

    <title>Apollo 17 in Real-time</title>
    <link rel="image_src" href="/img/screenshot.png" / >
    <meta name="description" content="A real-time interactive journey through the Apollo 17 mission. Relive every moment as it occurred in 1972. 300+ hours of audio, 22+ hours of video, 4,200+ photos." />

    <meta name="robots" content="index,follow" />

    <?php include 'inc/social_tags.html' ?>
    <?php include 'inc/chrome_tags.html' ?>
    
    <?php include 'inc/style_tags.html' ?>
    <?php include 'inc/script_tags_head.html' ?>

    <?php //include 'inc/script_templates.html' ?> <!-- old -->

</head>
<body>

    <?php include 'src/components/app17/app17.html' ?>

    <?php //include "inc/help_about.html"; ?>

    <?php //include "inc/splash.html"; ?>

    <?php include 'inc/script_tags_body.html' ?>

</body>
</html>
