
I had a problem running some of the scripts because the Python import space was too polluted.

To run the getMoreLayers, I had to create a venv, and then do

   venv/Scripts/activent
   pip install --update google-api-python-client

Then doing

   python getMoreLayers.py

worked.
