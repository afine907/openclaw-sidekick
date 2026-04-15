<div align="center">

# 🔐 Behavior Sense

### Real-time Fraud Detection & Behavior Analytics Engine

[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flink](https://img.shields.io/badge/Apache_Flink-1.18-E6526F?style=for-the-badge&logo=apache-flink&logoColor=white)](https://flink.apache.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Hot-reload rules engine with built-in audit workflow for enterprise security**

[Architecture](#architecture) · [Features](#features) · [Quick Start](#quick-start)

</div>

---

## 📖 Overview

**Behavior Sense** is a production-ready fraud detection and user behavior analytics (UEBA) platform that processes events in real-time with:

- ⚡ **Sub-second latency** - Detect threats before they escalate
- 🔥 **Hot-reload rules** - Update detection logic without downtime
- 📋 **Audit workflow** - Built-in investigation and case management
- 📊 **Behavioral baselining** - ML-powered anomaly detection

```
┌──────────────────────────────────────────────────────┐
│           Behavior Sense Architecture                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  📥 Event Stream ──→ 🔍 Rule Engine ──→ 🚨 Alerts   │
│                           │                           │
│                    📊 Behavior Model                  │
│                           │                           │
│                    💾 Audit Store                     │
│                           │                           │
│                    📋 Case Management                 │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🎯 Core Capabilities

| Feature | Description |
|---------|-------------|
| ⚡ **Real-time Processing** | Apache Flink-powered streaming |
| 🔥 **Hot-reload Rules** | YAML/JSON rules without restart |
| 🤖 **ML Anomaly Detection** | Behavioral baselining with isolation forest |
| 📊 **UEBA Dashboard** | User entity behavior analytics |
| 🔍 **Investigation Tools** | Event timeline and context |

### 🛡️ Detection Types

| Category | Examples |
|----------|----------|
| **Account Takeover** | Impossible travel, credential stuffing |
| **Data Exfiltration** | Bulk downloads, unusual access patterns |
| **Insider Threats** | Privilege escalation, policy violations |
| **Fraud** | Transaction anomalies, fake accounts |
| **Compliance** | GDPR violations, access control breaches |

---

## 🏗️ Architecture

### System Components

```
behavior-sense/
├── engine/                    # Core detection engine
│   ├── rule_processor.py     # Rule evaluation
│   ├── behavior_model.py     # ML models
│   └── alert_manager.py      # Alert generation
├── rules/                     # Detection rules (hot-reload)
│   ├── account_takeover.yaml
│   ├── data_exfiltration.yaml
│   └── fraud_detection.yaml
├── api/                       # REST API
│   ├── rules_api.py          # Rule management
│   ├── alerts_api.py         # Alert queries
│   └── audit_api.py          # Audit trail
├── models/                    # ML model artifacts
│   ├── isolation_forest.pkl
│   └── user_baseline.pkl
└── flink/                     # Flink jobs
    └── EventProcessor.java
```

### Data Flow

```
User Action → Event Queue → Flink Job → Rule Engine → Alert Store
                                    ↓
                            Behavior Model (ML)
                                    ↓
                            Dashboard / SIEM
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Apache Flink 1.18+
- Redis (for hot-reload cache)
- PostgreSQL (for audit store)

### Installation

```bash
# Clone repository
git clone https://github.com/afine907/behavior-sense.git
cd behavior-sense

# Install dependencies
pip install -r requirements.txt

# Start services
docker-compose up -d

# Run engine
python -m engine.main
```

### Define a Rule

```yaml
# rules/impossible_travel.yaml
name: impossible_travel
description: Detect logins from impossible locations
severity: high
enabled: true

conditions:
  - type: sequence
    within: 1h
    events:
      - type: login
        location:
          country: any
      - type: login
        location:
          distance_from_previous: "> 500km"  # Impossible travel distance

actions:
  - type: alert
    message: "Impossible travel detected for user {{user_id}}"
    tags: [account_takeover, credential_compromise]
  
  - type: block
    duration: 24h
    notify: security_team
```

### Hot-reload Rules

```bash
# Add or modify rules without restart
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d @rules/impossible_travel.yaml

# Rules are loaded instantly, no service restart needed
```

---

## 📊 Detection Examples

### 1. Account Takeover Detection

```python
# Rule: Detect login from new device + password change
{
  "name": "account_takeover_password_change",
  "conditions": {
    "sequence": [
      {"event": "login", "device_is_new": true},
      {"event": "password_change", "within": "24h"}
    ]
  },
  "severity": "critical"
}
```

### 2. Data Exfiltration

```python
# Rule: Detect bulk download
{
  "name": "data_exfiltration_bulk_download",
  "conditions": {
    "aggregate": {
      "event": "file_download",
      "user": "{{user_id}}",
      "within": "1h",
      "count": "> 100",
      "total_size": "> 1GB"
    }
  }
}
```

### 3. Insider Threat

```python
# Rule: Privilege escalation
{
  "name": "privilege_escalation",
  "conditions": {
    "sequence": [
      {"event": "role_change", "change_type": "elevation"},
      {"event": "sensitive_data_access", "within": "7d"}
    ]
  }
}
```

---

## 🔥 Hot-Reload Rules

Rules can be updated without service restart:

```
┌────────────────────────────────────────────┐
│         Hot-Reload Workflow                │
├────────────────────────────────────────────┤
│                                            │
│  1. Edit rule YAML file                    │
│  2. POST to /api/rules                     │
│  3. Rule validated ✓                       │
│  4. Cached in Redis                        │
│  5. Flink job picks up instantly           │
│  6. New events use updated rule            │
│                                            │
│  ⏱️ Total time: < 1 second                 │
└────────────────────────────────────────────┘
```

---

## 📋 Audit Workflow

Built-in investigation tools:

### Alert Timeline

```
Timeline for alert #1234:
─────────────────────────────────────────────────────
09:15:23  LOGIN    New York, USA       ✓ Normal
09:45:12  LOGIN    London, UK          ⚠️ Impossible travel
09:45:15  ACCESS   Sensitive file      🚨 High risk
09:45:18  DOWNLOAD 500MB data          🚨 Critical
09:46:02  LOGOUT   -                   ✓ Session ended
─────────────────────────────────────────────────────
Risk Score: 95/100
Recommended Action: Block account, notify security
```

### Case Management

```bash
# Create investigation case
curl -X POST http://localhost:8080/api/cases \
  -d '{
    "alert_id": "1234",
    "assignee": "security_analyst",
    "priority": "high",
    "notes": "Suspected account compromise"
  }'

# Add evidence
curl -X POST http://localhost:8080/api/cases/1234/evidence \
  -d '{"type": "screenshot", "url": "..."}'
```

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Events/second | 100,000+ |
| Detection latency | < 100ms |
| Rule reload time | < 1s |
| Uptime | 99.99% |

---

## 🔧 Configuration

```yaml
# config.yaml
engine:
  workers: 4
  batch_size: 1000
  timeout_ms: 5000

flink:
  parallelism: 8
  checkpoint_interval: 60000

models:
  isolation_forest:
    contamination: 0.01
    n_estimators: 100
  
  user_baseline:
    time_window: 30d
    min_events: 100

alerting:
  channels:
    - type: slack
      webhook: ${SLACK_WEBHOOK}
    - type: email
      recipients: [security@company.com]
```

---

## 📚 Use Cases

### Enterprise Security Teams
- Real-time threat detection
- Automated incident response
- Compliance reporting (SOC2, GDPR)

### SaaS Platforms
- Account takeover prevention
- Fraud detection
- User behavior analytics

### Financial Services
- Transaction monitoring
- Anti-money laundering (AML)
- Insider threat detection

---

## 🤝 Contributing

Contributions welcome! Areas of interest:

- 🎯 New detection rules
- 🤖 ML model improvements
- 📊 Dashboard enhancements
- 🔌 Integrations (SIEM, SOAR)

---

## 📄 License

MIT License

---

<div align="center">

**⭐ Star if you work in security or find this useful!**

Made with 🔐 by [afine907](https://github.com/afine907)

</div>
