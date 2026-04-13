#!/bin/bash
# Usage: ./scripts/add-subscriber.sh email@example.com "Name"
# Run from the decaf repo root

EMAIL="$1"
NAME="${2:-Subscriber}"
DATE=$(date +%Y-%m-%d)

if [ -z "$EMAIL" ]; then
  echo "Usage: $0 email@example.com \"Name\""
  exit 1
fi

python3 -c "
import json, sys
with open('subscribers.json') as f:
    data = json.load(f)
email, name, date = sys.argv[1], sys.argv[2], sys.argv[3]
if not any(s['email'] == email for s in data['subscribers']):
    data['subscribers'].insert(0, {'email': email, 'name': name, 'added': date})
    with open('subscribers.json', 'w') as f:
        json.dump(data, f, indent=2)
    print(f'Added {name} ({email})')
else:
    print(f'Already subscribed: {email}')
" "$EMAIL" "$NAME" "$DATE"

git add subscribers.json
git commit -m "Add subscriber: $NAME <$EMAIL>"
git push
