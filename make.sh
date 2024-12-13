set -e
zip -j duck_mail_converter_${1}.zip \
 popup.html \
 icon128.png \
 icon300.png \
 ./${1}/manifest.json \
 popup.js \
 styles.css \
 LICENSE.txt \
 README.md \
 ex_chrome.png \
 ex_firefox.png