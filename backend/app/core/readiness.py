from typing import Dict, Any, List
from datetime import datetime

class ReadinessEngine:

    def generate_readiness_plan(self, region_meta: Dict[str, Any], anomaly_data: Dict[str, Any], forecast_data: Dict[str, Any], fingerprint_data: Dict[str, Any]) -> Dict[str, Any]:
        level_code = anomaly_data.get('level_code', 1)
        status = anomaly_data.get('status', 'Normal')
        p30_label = forecast_data.get('horizons', {}).get('30d', {}).get('label', 'Normal')
        overall_readiness_level = 'Standard Surveillance'
        readiness_badge = 'Level 1: Routine Baseline'
        badge_color = 'emerald'
        if level_code == 3 or p30_label == 'High':
            overall_readiness_level = 'Heightened Incident Readiness'
            readiness_badge = 'Level 3: Critical Pre-Deployment'
            badge_color = 'rose'
        elif level_code == 2 or p30_label == 'Elevated':
            overall_readiness_level = 'Heightened Monitoring'
            readiness_badge = 'Level 2: Active Preparedness'
            badge_color = 'amber'
        checklist = self._build_action_checklist(overall_readiness_level, region_meta, anomaly_data)
        peak_months = set(region_meta.get('peak_months', [8, 9, 10]))
        monthly_readiness = []
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        for m_idx in range(1, 13):
            m_name = month_names[m_idx - 1]
            if m_idx in peak_months:
                vigilance = 'Heightened'
                v_color = 'rose' if overall_readiness_level.startswith('Heightened') and datetime.utcnow().month == m_idx else 'amber'
            elif m_idx - 1 in peak_months or m_idx + 1 in peak_months:
                vigilance = 'Pre-Season Transition'
                v_color = 'blue'
            else:
                vigilance = 'Low Baseline'
                v_color = 'slate'
            monthly_readiness.append({'month_num': m_idx, 'month_name': m_name, 'vigilance_level': vigilance, 'color': v_color, 'is_current_month': datetime.utcnow().month == m_idx})
        return {'region_id': region_meta.get('id', 'custom'), 'region_name': region_meta.get('name', 'Custom AOI'), 'readiness_level': overall_readiness_level, 'readiness_badge': readiness_badge, 'badge_color': badge_color, 'current_status': status, 'anomaly_z_score': anomaly_data.get('robust_z_score', 0.0), 'forecast_30d_label': p30_label, 'checklist': checklist, 'monthly_readiness_calendar': monthly_readiness, 'as_of_date': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), 'footer_disclaimer': 'Based on historical patterns and model estimates. Not a live emergency alert or official evacuation order.'}

    def _build_action_checklist(self, level: str, region_meta: Dict[str, Any], anomaly_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        is_high = 'Critical' in level or 'Heightened Incident' in level
        is_elevated = 'Active Preparedness' in level or 'Heightened Monitoring' in level
        items = [{'category': 'Monitoring Frequency', 'action': 'Synchronize satellite overpass schedule (VIIRS S-NPP ~01:30/13:30, NOAA-20 ~02:20/14:20 local) with real-time detection alerts.', 'priority': 'High' if is_high or is_elevated else 'Routine', 'completed': False, 'protocol': 'Automate webhook push for fresh detections with FRP > 50 MW.'}, {'category': 'Review of Response Plans', 'action': 'Audit inter-district wildland mutual aid response plans and initial attack protocols.', 'priority': 'High' if is_high else 'Medium' if is_elevated else 'Routine', 'completed': False, 'protocol': 'Verify direct communication channels between wildland strike coordinators.'}, {'category': 'Inter-Agency Communications', 'action': 'Initiate regional cross-jurisdiction situational briefings with forestry and emergency management liaisons.', 'priority': 'High' if is_high else 'Medium' if is_elevated else 'Low', 'completed': False, 'protocol': 'Share harmonised 30-day forecast anomaly index with dispatch commanders.'}, {'category': 'Resource Readiness', 'action': 'Verify mechanical availability of wildland type 3 engines, aerial spotters, and heavy bulldozers.', 'priority': 'Critical' if is_high else 'High' if is_elevated else 'Standard', 'completed': False, 'protocol': 'Ensure pre-positioned water tenders have verified fill point access.'}, {'category': 'Public-Safety Messaging', 'action': 'Issue targeted public notices regarding open burning restrictions and defensible space clearances.', 'priority': 'High' if is_high else 'Medium' if is_elevated else 'Informational', 'completed': False, 'protocol': 'Publish high-risk dry vegetation warnings through local civic channels.'}, {'category': 'Air-Quality & Health Advisories', 'action': 'Pre-alert regional public health clinics regarding particulate matter (PM2.5) smoke exposure vulnerability.', 'priority': 'High' if is_high or is_elevated else 'Standard', 'completed': False, 'protocol': 'Activate clean-air shelter advisories for senior and pediatric respiratory demographics.'}]
        return items
