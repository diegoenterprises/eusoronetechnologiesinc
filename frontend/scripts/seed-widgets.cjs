const mysql = require('mysql2/promise');
require('dotenv').config();

const U = ['SHIPPER','CARRIER','BROKER','DRIVER','CATALYST','ESCORT','TERMINAL_MANAGER','COMPLIANCE_OFFICER','SAFETY_MANAGER','ADMIN','SUPER_ADMIN'];

const widgets = [
  // Universal (12)
  ['weather','Weather','Live weather with 5-day forecast','productivity',U],
  ['calendar','Calendar','Schedule pickups, deliveries, appointments','productivity',U],
  ['notes','Quick Notes','Personal notes synced to your account','productivity',U],
  ['tasks','Task List','To-do list with priorities','productivity',U],
  ['notifications','Notifications','Real-time platform alerts','communication',U],
  ['messages','Messages','Direct messaging','communication',U],
  ['quick_actions','Quick Actions','One-tap frequent actions','productivity',U],
  ['search','Global Search','Search loads, carriers, docs','productivity',U],
  ['recent_activity','Recent Activity','Latest actions and updates','productivity',U],
  ['performance_summary','Performance Summary','Key performance indicators','analytics',U],
  ['live_map','Live Map','Real-time GPS tracking','tracking',U],
  ['spectra_match','SPECTRA-MATCH™','AI fuel product identification','operations',['SHIPPER','CARRIER','DRIVER','CATALYST','TERMINAL_MANAGER']],
  // Shipper (15)
  ['active_shipments','Active Shipments','Track current shipments with ETA','operations',['SHIPPER']],
  ['shipment_costs','Shipment Costs','Cost breakdown per shipment','financial',['SHIPPER']],
  ['carrier_ratings','Carrier Ratings','Carrier performance scores','analytics',['SHIPPER']],
  ['delivery_timeline','Delivery Timeline','Expected delivery dates','planning',['SHIPPER']],
  ['freight_quotes','Freight Quotes','Compare carrier quotes','financial',['SHIPPER']],
  ['shipment_tracking','Live Tracking','Real-time shipment positions','tracking',['SHIPPER']],
  ['delivery_exceptions','Delivery Exceptions','Delays and issues','operations',['SHIPPER']],
  ['shipping_volume','Shipping Volume','Monthly shipment trends','analytics',['SHIPPER']],
  ['carrier_network','Carrier Network','Available carriers map','planning',['SHIPPER']],
  ['cost_savings','Cost Savings','Savings opportunities','financial',['SHIPPER']],
  ['shipping_calendar','Shipping Calendar','Scheduled pickups/deliveries','planning',['SHIPPER']],
  ['pod_documents','POD Documents','Proof of delivery files','operations',['SHIPPER']],
  ['freight_audit','Freight Audit','Invoice verification','financial',['SHIPPER']],
  ['carrier_capacity','Carrier Capacity','Available capacity','planning',['SHIPPER']],
  ['shipment_analytics','Shipment Analytics','Shipping data analytics','analytics',['SHIPPER']],
  // Carrier (15)
  ['available_loads','Available Loads','Load board with freight','operations',['CARRIER']],
  ['fleet_status','Fleet Status','Real-time fleet overview','operations',['CARRIER']],
  ['driver_availability','Driver Availability','Available drivers','operations',['CARRIER']],
  ['revenue_dashboard','Revenue Dashboard','Earnings and profitability','financial',['CARRIER']],
  ['fuel_costs','Fuel Costs','Fuel expenses and trends','financial',['CARRIER']],
  ['maintenance_schedule','Maintenance Schedule','Vehicle maintenance','operations',['CARRIER']],
  ['route_optimization','Route Optimization','Optimal routing','planning',['CARRIER']],
  ['load_matching','Load Matching','AI load recommendations','operations',['CARRIER']],
  ['driver_performance','Driver Performance','Driver metrics','analytics',['CARRIER']],
  ['detention_time','Detention Time','Loading/unloading delays','operations',['CARRIER']],
  ['insurance_tracker','Insurance Tracker','Insurance compliance','compliance',['CARRIER']],
  ['profit_margin','Profit Margin','Per-load profitability','financial',['CARRIER']],
  ['dispatch_board','Dispatch Board','Active dispatches','operations',['CARRIER']],
  ['equipment_utilization','Equipment Utilization','Asset usage','analytics',['CARRIER']],
  ['broker_relationships','Broker Relationships','Top brokers','analytics',['CARRIER']],
  // Broker (15)
  ['load_board','Load Board','Posted and available loads','operations',['BROKER']],
  ['carrier_sourcing','Carrier Sourcing','Find and vet carriers','operations',['BROKER']],
  ['margin_calculator','Margin Calculator','Profit margin analysis','financial',['BROKER']],
  ['customer_accounts','Customer Accounts','Shipper relationships','management',['BROKER']],
  ['rate_trends','Rate Trends','Market rate analysis','analytics',['BROKER']],
  ['bid_management','Bid Management','Active bids tracking','operations',['BROKER']],
  ['coverage_map','Coverage Map','Service area lanes','planning',['BROKER']],
  ['commission_tracker','Commission Tracker','Earnings commissions','financial',['BROKER']],
  ['shipper_pipeline','Shipper Pipeline','Sales opportunities','management',['BROKER']],
  ['carrier_scorecards','Carrier Scorecards','Carrier ratings','analytics',['BROKER']],
  ['load_matching_ai','AI Load Matching','Smart recommendations','operations',['BROKER']],
  ['payment_status','Payment Status','Invoicing payments','financial',['BROKER']],
  ['lane_analysis','Lane Analysis','Profitable lanes','analytics',['BROKER']],
  ['contract_management','Contract Management','Agreements terms','management',['BROKER']],
  ['market_intelligence','Market Intelligence','Industry trends','analytics',['BROKER']],
  // Driver (15)
  ['current_route','Current Route','Active route navigation','operations',['DRIVER']],
  ['hos_tracker','HOS Tracker','Hours of service','compliance',['DRIVER']],
  ['earnings_summary','Earnings Summary','Pay and bonuses','financial',['DRIVER']],
  ['next_delivery','Next Delivery','Upcoming delivery','operations',['DRIVER']],
  ['fuel_stations','Fuel Stations','Nearby fuel stops','planning',['DRIVER']],
  ['rest_areas','Rest Areas','Nearby rest stops','planning',['DRIVER']],
  ['trip_summary','Trip Summary','Current trip metrics','analytics',['DRIVER']],
  ['vehicle_health','Vehicle Health','Truck diagnostics','operations',['DRIVER']],
  ['weather_alerts','Weather Alerts','Route weather','safety',['DRIVER']],
  ['traffic_updates','Traffic Updates','Real-time traffic','operations',['DRIVER']],
  ['delivery_checklist','Delivery Checklist','Pre/post-trip inspections','operations',['DRIVER']],
  ['dispatcher_chat','Dispatcher Chat','Direct messaging','communication',['DRIVER']],
  ['mileage_tracker','Mileage Tracker','Trip mileage IFTA','analytics',['DRIVER']],
  ['load_documents','Load Documents','BOL delivery docs','operations',['DRIVER']],
  ['performance_score','Performance Score','Driver rating','analytics',['DRIVER']],
  // Catalyst (10)
  ['escort_assignments','Escort Assignments','Current escorts','operations',['CATALYST']],
  ['route_permits','Route Permits','Permit status','compliance',['CATALYST']],
  ['oversized_loads','Oversized Loads','Special handling','operations',['CATALYST']],
  ['coordination_map','Coordination Map','Multi-vehicle tracking','operations',['CATALYST']],
  ['safety_protocols','Safety Protocols','Safety checklists','safety',['CATALYST']],
  ['communication_hub','Communication Hub','Team coordination','communication',['CATALYST']],
  ['incident_reports','Incident Reports','Safety incidents','safety',['CATALYST']],
  ['equipment_checklist','Equipment Checklist','Equipment verification','operations',['CATALYST']],
  ['route_restrictions','Route Restrictions','Bridge heights limits','planning',['CATALYST']],
  ['escort_earnings','Escort Earnings','Compensation tracking','financial',['CATALYST']],
  // Escort (10)
  ['active_escort','Active Escort','Current assignment','operations',['ESCORT']],
  ['route_navigation','Route Navigation','Turn-by-turn nav','operations',['ESCORT']],
  ['load_dimensions','Load Dimensions','Size weight specs','operations',['ESCORT']],
  ['clearance_alerts','Clearance Alerts','Height width warnings','safety',['ESCORT']],
  ['escort_checklist','Escort Checklist','Pre-trip checks','safety',['ESCORT']],
  ['driver_communication','Driver Communication','Direct driver contact','communication',['ESCORT']],
  ['emergency_contacts','Emergency Contacts','Emergency numbers','safety',['ESCORT']],
  ['trip_log','Trip Log','Escort trip docs','operations',['ESCORT']],
  ['permit_verification','Permit Verification','Route permit validation','compliance',['ESCORT']],
  ['escort_pay','Escort Pay','Trip earnings','financial',['ESCORT']],
  // Terminal (15)
  ['yard_management','Yard Management','Trailer equipment tracking','operations',['TERMINAL_MANAGER']],
  ['dock_scheduling','Dock Scheduling','Loading dock assignments','planning',['TERMINAL_MANAGER']],
  ['inbound_shipments','Inbound Shipments','Arriving freight','operations',['TERMINAL_MANAGER']],
  ['outbound_shipments','Outbound Shipments','Departing freight','operations',['TERMINAL_MANAGER']],
  ['labor_management','Labor Management','Staff scheduling','management',['TERMINAL_MANAGER']],
  ['equipment_inventory','Equipment Inventory','Equipment status','operations',['TERMINAL_MANAGER']],
  ['loading_efficiency','Loading Efficiency','Dock productivity','analytics',['TERMINAL_MANAGER']],
  ['damage_reports','Damage Reports','Freight damage','operations',['TERMINAL_MANAGER']],
  ['storage_capacity','Storage Capacity','Warehouse utilization','analytics',['TERMINAL_MANAGER']],
  ['cross_dock_operations','Cross-Dock Ops','Direct transfer','operations',['TERMINAL_MANAGER']],
  ['safety_incidents','Safety Incidents','Terminal safety','safety',['TERMINAL_MANAGER']],
  ['gate_activity','Gate Activity','Truck check-in/out','operations',['TERMINAL_MANAGER']],
  ['detention_charges','Detention Charges','Carrier detention fees','financial',['TERMINAL_MANAGER']],
  ['inventory_accuracy','Inventory Accuracy','Stock accuracy','analytics',['TERMINAL_MANAGER']],
  ['terminal_kpis','Terminal KPIs','Performance scorecard','analytics',['TERMINAL_MANAGER']],
  // Compliance (15)
  ['compliance_dashboard','Compliance Dashboard','Overall compliance','compliance',['COMPLIANCE_OFFICER']],
  ['driver_qualifications','Driver Qualifications','License cert tracking','compliance',['COMPLIANCE_OFFICER']],
  ['vehicle_inspections','Vehicle Inspections','DOT inspections','compliance',['COMPLIANCE_OFFICER']],
  ['hos_violations','HOS Violations','HOS compliance','compliance',['COMPLIANCE_OFFICER']],
  ['drug_testing','Drug Testing','Testing schedule','compliance',['COMPLIANCE_OFFICER']],
  ['insurance_compliance','Insurance Compliance','Coverage verification','compliance',['COMPLIANCE_OFFICER']],
  ['audit_tracker','Audit Tracker','Audit tracking','compliance',['COMPLIANCE_OFFICER']],
  ['training_records','Training Records','Training completion','compliance',['COMPLIANCE_OFFICER']],
  ['ifta_reporting','IFTA Reporting','Fuel tax compliance','compliance',['COMPLIANCE_OFFICER']],
  ['dot_number_status','DOT Number Status','Authority registration','compliance',['COMPLIANCE_OFFICER']],
  ['violation_trends','Violation Trends','Compliance patterns','analytics',['COMPLIANCE_OFFICER']],
  ['permit_management','Permit Management','Special permits','compliance',['COMPLIANCE_OFFICER']],
  ['csa_scores','CSA Scores','FMCSA safety scores','compliance',['COMPLIANCE_OFFICER']],
  ['document_expiration','Document Expiration','Expiring docs alert','compliance',['COMPLIANCE_OFFICER']],
  ['compliance_costs','Compliance Costs','Compliance expenses','financial',['COMPLIANCE_OFFICER']],
  // Safety (15)
  ['safety_dashboard','Safety Dashboard','Overall safety metrics','safety',['SAFETY_MANAGER']],
  ['accident_tracker','Accident Tracker','Incident tracking','safety',['SAFETY_MANAGER']],
  ['driver_safety_scores','Driver Safety Scores','Driver safety ratings','safety',['SAFETY_MANAGER']],
  ['safety_training','Safety Training','Training programs','safety',['SAFETY_MANAGER']],
  ['near_miss_reports','Near Miss Reports','Close call incidents','safety',['SAFETY_MANAGER']],
  ['vehicle_maintenance','Vehicle Maintenance','Preventive maintenance','safety',['SAFETY_MANAGER']],
  ['safety_meetings','Safety Meetings','Meeting schedule','safety',['SAFETY_MANAGER']],
  ['hazmat_compliance','Hazmat Compliance','Hazmat tracking','safety',['SAFETY_MANAGER']],
  ['safety_equipment','Safety Equipment','PPE inventory','safety',['SAFETY_MANAGER']],
  ['risk_assessment','Risk Assessment','Risk mitigation','safety',['SAFETY_MANAGER']],
  ['injury_rates','Injury Rates','OSHA incidents','analytics',['SAFETY_MANAGER']],
  ['emergency_procedures','Emergency Procedures','Response plans','safety',['SAFETY_MANAGER']],
  ['safety_inspections','Safety Inspections','Facility checks','safety',['SAFETY_MANAGER']],
  ['claims_management','Claims Management','Insurance claims','safety',['SAFETY_MANAGER']],
  ['safety_roi','Safety ROI','Safety program savings','financial',['SAFETY_MANAGER']],
  // Premium Analytics (13)
  ['revenue_forecasting','Revenue Forecasting','AI revenue predictions','analytics',['SHIPPER','CARRIER','BROKER']],
  ['route_optimization_ai','Route Optimization AI','ML route efficiency','analytics',['CARRIER','DRIVER','BROKER']],
  ['predictive_maintenance','Predictive Maintenance','Maintenance AI','analytics',['CARRIER','TERMINAL_MANAGER']],
  ['demand_heatmap','Demand Heatmap','Geographic demand viz','analytics',['SHIPPER','CARRIER','BROKER']],
  ['driver_performance_analytics','Driver Perf Analytics','Driver metrics','analytics',['CARRIER','TERMINAL_MANAGER']],
  ['fuel_efficiency_analytics','Fuel Efficiency Analytics','Fuel optimization','analytics',['CARRIER','DRIVER']],
  ['load_utilization','Load Utilization','Weight volume opt','analytics',['CARRIER','SHIPPER']],
  ['compliance_score','Compliance Score','Real-time compliance','compliance',['CARRIER','COMPLIANCE_OFFICER','SAFETY_MANAGER']],
  ['advanced_market_rates','Market Rates Analysis','Freight rate trends','financial',['BROKER','CARRIER','SHIPPER']],
  ['bid_win_rate','Bid Win Rate','Bidding analytics','analytics',['CARRIER','BROKER']],
  ['real_time_tracking','Real-Time Tracking','Live shipment tracking','tracking',['SHIPPER','CARRIER','BROKER']],
  ['cost_breakdown','Cost Breakdown','Detailed cost analysis','financial',['SHIPPER','CARRIER','BROKER']],
  ['customer_satisfaction','Customer Satisfaction','Feedback analytics','analytics',['SHIPPER','CARRIER','BROKER']],
  // Additional dynamic widgets
  ['hos_monitoring','HOS Monitoring','Multi-driver HOS','compliance',['COMPLIANCE_OFFICER','SAFETY_MANAGER','CARRIER']],
  ['market_rates','Market Rates','Lane rate data','financial',['BROKER','CARRIER']],
  ['detention_tracker','Detention Tracker','Detention time tracking','operations',['CARRIER','SHIPPER']],
];

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let inserted = 0;
  for (const [key, name, desc, cat, roles] of widgets) {
    try {
      await conn.execute(
        `INSERT INTO dashboard_widgets (widgetKey, name, description, category, defaultWidth, defaultHeight, minWidth, minHeight, maxWidth, maxHeight, rolesAllowed, isActive, componentPath)
         VALUES (?, ?, ?, ?, 4, 4, 2, 2, 12, 8, ?, 1, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), category=VALUES(category), rolesAllowed=VALUES(rolesAllowed)`,
        [key, name, desc, cat, JSON.stringify(roles), `widgets/${key}`]
      );
      inserted++;
    } catch (e) {
      console.error(`Failed ${key}:`, e.message);
    }
  }
  console.log(`Seeded ${inserted}/${widgets.length} widgets`);
  const [[c]] = await conn.execute('SELECT COUNT(*) as c FROM dashboard_widgets');
  console.log(`Total widgets in DB: ${c.c}`);
  await conn.end();
})();
