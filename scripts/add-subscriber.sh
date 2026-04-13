#!/bin/bash
# Usage: ./scripts/add-subscriber.sh email@example.com "Name"
EMAIL="$1"
NAME="${2:-Subscriber}"
DATE=$(date +%Y-%m-%d)

if [ -z "$EMAIL" ]; then
  echo "Usage: $0 email@example.com [Name]"
  exit 1
fi

# Add to subscribers.json
python3 -c "
import json, sys
with open('subscribers.json') as f:
    data = json.load(f)
new_sub = {'email': sys.argv[1], 'name': sys.argv[2], 'added': sys.argv[3]}
if not any(s['email'] == sys.argv[1] for s in data['subscribers']):
    data['subscribers'].insert(0, new_sub)
    with open('subscribers.json', 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    print(f'Added {sys.argv[2]} ({sys.argv[1]})')
else:
    print(f'Already subscribed: {sys.argv[1]}')
" "$EMAIL" "$NAME" "$DATE"

# Commit and push
git add subscribers.json
git commit -m "Add subscriber: $NAME"
git push
