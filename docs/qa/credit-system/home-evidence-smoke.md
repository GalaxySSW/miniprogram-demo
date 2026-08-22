# 积分接缝接入后的首页到证据页冒烟

## Summary

- Status: PASS
- stopOnFailure: true
- totalSteps: 7
- executedSteps: 7
- passedSteps: 7
- failedSteps: 0

## Steps

### 1. navigate PASS

**Step**
```json
{
  "type": "navigate",
  "path": "pages/home/home",
  "transition": "reLaunch",
  "waitMs": 300
}
```

**Result**
```json
{
  "transition": "reLaunch",
  "url": "/pages/home/home",
  "activePage": {
    "path": "pages/home/home",
    "query": {}
  }
}
```

### 2. expectRoute PASS

**Step**
```json
{
  "type": "expectRoute",
  "path": "pages/home/home"
}
```

**Result**
```json
{
  "pass": true,
  "expected": "pages/home/home",
  "actual": "pages/home/home",
  "snapshot": {
    "path": "pages/home/home",
    "query": {}
  }
}
```

### 3. expectVisible PASS

**Step**
```json
{
  "type": "expectVisible",
  "selector": ".btn-primary"
}
```

**Result**
```json
{
  "pass": true,
  "expected": true,
  "actual": true,
  "snapshot": {
    "selector": ".btn-primary",
    "count": 1,
    "index": null
  }
}
```

### 4. tap PASS

**Step**
```json
{
  "type": "tap",
  "selector": ".btn-primary",
  "waitMs": 300
}
```

**Result**
```json
{
  "selector": ".btn-primary",
  "innerSelector": null,
  "tapped": true
}
```

### 5. waitRoute PASS

**Step**
```json
{
  "type": "waitRoute",
  "path": "pages/evidence/evidence",
  "timeout": 5000,
  "retryInterval": 200
}
```

**Result**
```json
{
  "path": "pages/evidence/evidence",
  "matched": true,
  "waitTime": 206,
  "query": {}
}
```

### 6. expectVisible PASS

**Step**
```json
{
  "type": "expectVisible",
  "selector": ".btn-primary"
}
```

**Result**
```json
{
  "pass": true,
  "expected": true,
  "actual": true,
  "snapshot": {
    "selector": ".btn-primary",
    "count": 1,
    "index": null
  }
}
```

### 7. snapshot PASS

**Step**
```json
{
  "type": "snapshot",
  "selectors": [
    ".btn-primary"
  ],
  "dataPaths": [],
  "withData": false,
  "withElements": true,
  "withWxml": false,
  "limit": 10,
  "maxBytes": 50000
}
```

**Result**
```json
{
  "route": "pages/evidence/evidence",
  "query": {},
  "data": {},
  "selectors": [
    ".btn-primary"
  ],
  "elementCount": 1,
  "elementsLimited": false,
  "processedSelectorCount": 1,
  "elementSummaryLimit": 100,
  "elements": [
    {
      "selector": ".btn-primary",
      "index": 0,
      "tagName": "view",
      "text": "下一步 · 我来陈述",
      "value": null,
      "size": {
        "width": 374,
        "height": 59
      },
      "offset": {
        "left": 28,
        "top": 702.8046875
      }
    }
  ]
}
```
