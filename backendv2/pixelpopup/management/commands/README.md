How to use it Clone Page

Clone just the page + scenes:

python manage.py clone_page 12

Clone page + scenes + asset rows:

python manage.py clone_page 12 --copy-assets

Make sure the cloned page is safe (recommended):

python manage.py clone_page 12 --copy-assets --reset-password --reset-expiry
