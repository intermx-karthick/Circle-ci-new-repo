cd /home/travis/build/InterMx/widgetworld
cp -rf /home/travis/build/InterMx/widgetworld/dist /home/travis/build/InterMx/widgetworld/travis
cd travis
zip -r /home/travis/build/InterMx/widgetworld/travis/travis.zip ./*
ls -lh
echo "deploy ============> testing"