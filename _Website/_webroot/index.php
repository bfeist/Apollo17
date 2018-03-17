<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <link rel="copyright" href="http://creativecommons.org/licenses/by-nc-sa/3.0/" />

    <title>Apollo 17 in Real-time</title>
    <link rel="image_src" href="http://apollo17.org/img/screenshot.png" / >
    <meta name="description" content="A real-time interactive journey through the Apollo 17 mission. Relive every moment as it occurred in 1972. 300+ hours of audio, 22+ hours of video, 4,200+ photos." />

    <meta property="fb:app_id" content="1639595472942714" />
    <meta property="og:title" content="Apollo 17 in Real-time" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="http://apollo17.org/img/screenshot.png" />
    <meta property="og:url" content="http://apollo17.org/" />
    <meta property="og:description" content="A real-time interactive journey through the Apollo 17 mission. Relive every moment as it occurred in 1972. 300+ hours of audio, 22+ hours of video, 4,200+ photos." />
    <meta property="og:site_name" content="Apollo 17 in Real-time" />

    <link rel="apple-touch-icon" sizes="57x57" href="favicons/apple-touch-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="favicons/apple-touch-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="favicons/apple-touch-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="favicons/apple-touch-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="favicons/apple-touch-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="favicons/apple-touch-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="favicons/apple-touch-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="favicons/apple-touch-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="favicons/apple-touch-icon-180x180.png">
    <link rel="icon" type="image/png" href="favicons/favicon-32x32.png" sizes="32x32">
    <link rel="icon" type="image/png" href="favicons/android-chrome-192x192.png" sizes="192x192">
    <link rel="icon" type="image/png" href="favicons/favicon-96x96.png" sizes="96x96">
    <link rel="icon" type="image/png" href="favicons/favicon-16x16.png" sizes="16x16">
    <link rel="manifest" href="favicons/manifest.json">
    <link rel="shortcut icon" href="favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="msapplication-TileImage" content="favicons/mstile-144x144.png">
    <meta name="msapplication-config" content="favicons/browserconfig.xml">
    <meta name="theme-color" content="#000000">

    <meta name="robots" content="index,follow" />

    <?php include "inc/style_tags.html" ?>

    <script>
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','http://www.google-analytics.com/analytics.js','ga');

        ga('create', 'UA-37086725-2', 'auto');
        ga('send', 'pageview');
    </script>
    <script type="text/javascript" src="lib/webfontloader.js"></script>
    <script type="text/javascript" src="lib/jquery-2.1.4.min.js"></script>
    <script type="text/javascript" src="lib/jquery_plugins.js"></script>
<!--    <script type="text/javascript" src="lib/jquery-ui.js"></script>-->
    <script type="text/javascript" src="lib/jquery.fullscreen.js"></script>
    <script type="text/javascript" src='lib/jquery.lazyload.js'></script>
<!--    <script type="text/javascript" src='lib/jquery.browser.js'></script>-->
    <script type="text/javascript" src="lib/paper-full.js"></script>
    <script type="text/javascript" src="lib/date.js"></script>
<!--    <script type="text/javascript" src="lib/moment.js"></script>-->
<!--    <script type="text/javascript" src="lib/readable-range.js"></script>-->
    <script type="text/javascript" src='lib/share.js'></script>
    <script type="text/javascript" src='lib/jquery.waitforimages.min.js'></script>

    <script type="text/javascript" src='lib/size_manager.js'></script>
    <script type="text/javascript" src='lib/help_overlay_manager.js'></script>
    <script type="text/javascript" src='lib/modemizr.js'></script>
    <script type="text/javascript" src="navigator.js"></script>
    <script type="text/javascript" src="index.js?nocache=1.2"></script>
    <script type="text/javascript" src="ajax.js?nocache=1.2"></script>

</head>
<body>

  <?php include "inc/app.html"; ?>

  <?php include "inc/help_about.html"; ?>

  <?php include "inc/splash.html"; ?>

</body>

<script type="text/html" id="photoTemplate">
    <div class="imageBlock">
        <div class="imageContainer" style="background-image: url('@serverUrl/mission_images/@photoTypePath/@sizepath/@filename.jpg')">

            <a href="http://apollo17.org/mission_images/@photoTypePath/@fullSizePath/@filename.jpg" target="photowindow">
                <img src="img/placeholder-square.png" class="aspect-holder">
            </a>

            <div id="imageOverlay">
                <div class="photodivcaption">@description</div>
                <table class="photoTable">
                    <tr>
                        <td>
                            <div>Mission Time Taken:</div>
                            <div>@timeStr</div>
                        </td>
                        <td>
                            <div>Photo:</div>
                            <div>@mag_code @filename</div>
                        </td>
                        <td>
                            <div>Photographer:</div>
                            <div>@photographer</div>
                        </td>
                    </tr>
                </table>
            </div>

        </div>
    </div>
</script>

<script type="text/html" id="utteranceTemplate">
    <tr class="utterance utt_pao uttid@uttid" id="uttid@uttid" style="@style" onclick="seekToTime('@uttid')">
        <td class="timestamp">@timestamp</td>
        <td class="who @uttType">@who</td>
        <td class="spokenwords @uttType">@words</td>
    </tr>
</script>

<script type="text/html" id="commentaryTemplate">
    <tr class="commentary utt_pao comid@comid" id="comid@comid" onclick="seekToTime('@comid')" >
        <td class="timestamp">@timestamp</td>
        @whocell
        @wordscell
    </tr>
</script>

<script type="text/html" id="photoGalleryTemplate">
    <div class="galleryItemContainer" id="gallerytimeid@timeid" onclick="galleryClick('@timeid')">
        <img class="galleryImage" data-original="@serverUrl/mission_images/@photoTypePath/100/@filename">
        <div class="galleryOverlay">@timestamp</div>
    </div>
</script>

<script type="text/html" id="searchResultTemplate">
    <tr class="utterance utt_pao" style="@style" onclick="searchResultClick('@searchResultid', '@entrytypevar')">
        <td class="timestamp">@timestamp<BR>@entrytype</td>
        <td class="who @uttType">@who</td>
        <td class="spokenwords @uttType"> @words</td>
    </tr>
</script>

<script type="text/html" id="geosampleTemplate">
    <div class="sampleframe">
        <div class="sampletitle">Sample @samplenumber</div>
        <div class="samplesubtitle"><a href="http://moondb.org" target="_blank"><img src="./img/moondb-logo.png" height="25px"></a> Sample Information</div>
        <div class="externallinks" id="externallinks@samplenumber">
            <table class='sampleinfotable'>
                <tr>
                    <td>External links</td>
                    <td colspan="3">
                        <span><a href='https://curator.jsc.nasa.gov/lunar/samplecatalog/sampleinfo.cfm?sample=@samplenumber' target='geoImage'>Lunar Sample Curation Info</a></span>
                        @geocompendium
                    </td>
                </tr>
            </table>
        </div>
        <div class="moondb" id="moondb@samplenumber"></div>
        <div class="geoImages" id="geoImages@samplenumber"></div>
        <div class="geoPapers" id="geoPapers@samplenumber">@papers</div>
    </div>
</script>

</html>