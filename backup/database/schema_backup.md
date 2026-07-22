# Supabase Database Schema Backup

## Table: household_members
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| household_id | string | uuid | Note:
This is a Foreign Key to `households.id`.<fk table='households' column='id'/> | No |
| citizen_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| relation_to_owner | string | character varying |  | Yes |
| joined_at | string | date |  | No |

## Table: users
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| username | string | character varying |  | Yes |
| email | string | character varying |  | Yes |
| password_hash | string | character varying |  | Yes |
| is_active | boolean | boolean |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: gis_points
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | text | Note:
This is a Primary Key.<pk/> | Yes |
| title | string | text |  | Yes |
| lat | number | double precision |  | Yes |
| lng | number | double precision |  | Yes |
| type | string | text |  | No |
| icon | string | text |  | No |
| description | string | text |  | No |
| address | string | text |  | No |
| notes | string | text |  | No |
| status | string | text |  | No |
| image | string | text |  | No |
| is_deleted | boolean | boolean |  | No |
| created_by | string | text |  | No |
| created_at | string | timestamp with time zone |  | No |
| updated_by | string | text |  | No |
| updated_at | string | timestamp with time zone |  | No |

## Table: attachments
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| entity_type | string | character varying |  | Yes |
| entity_id | string | uuid |  | Yes |
| file_path | string | character varying |  | Yes |
| file_type | string | character varying |  | No |
| file_size | integer | integer |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: role_permissions
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| role_id | string | uuid | Note:
This is a Foreign Key to `roles.id`.<fk table='roles' column='id'/> | No |
| permission_id | string | uuid | Note:
This is a Foreign Key to `permissions.id`.<fk table='permissions' column='id'/> | No |

## Table: plans
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | text | Note:
This is a Primary Key.<pk/> | Yes |
| title | string | text |  | Yes |
| deadline | string | text |  | No |
| status | string | text |  | No |
| aiContent | string | text |  | No |
| attachedFile | undefined | jsonb |  | No |
| created_at | string | timestamp with time zone |  | No |
| updated_at | string | timestamp with time zone |  | No |

## Table: temporary_residence
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| citizen_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| household_id | string | uuid | Note:
This is a Foreign Key to `households.id`.<fk table='households' column='id'/> | No |
| start_date | string | date |  | Yes |
| end_date | string | date |  | Yes |
| registration_number | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: boarding_rooms
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| boarding_house_id | string | uuid | Note:
This is a Foreign Key to `boarding_houses.id`.<fk table='boarding_houses' column='id'/> | No |
| room_number | string | character varying |  | Yes |
| price | number | numeric |  | Yes |
| max_tenants | integer | integer |  | No |
| status | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: officer_evaluations
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| officer_id | string | uuid | Note:
This is a Foreign Key to `officers.id`.<fk table='officers' column='id'/> | No |
| year | integer | integer |  | Yes |
| rating | string | character varying |  | Yes |
| achievements | string | text |  | No |
| feedback | string | text |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: fund_contributions
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| household_code | string | character varying |  | Yes |
| owner_name | string | character varying |  | Yes |
| fund_name | string | character varying |  | No |
| amount | number | numeric |  | Yes |
| status | string | character varying |  | No |
| paid_at | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: notifications
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| user_id | string | uuid | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> | No |
| title | string | character varying |  | Yes |
| content | string | text |  | Yes |
| is_read | boolean | boolean |  | No |
| send_type | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: user_roles
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| user_id | string | uuid | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> | No |
| role_id | string | uuid | Note:
This is a Foreign Key to `roles.id`.<fk table='roles' column='id'/> | No |

## Table: khu_vuc
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| name | string | character varying |  | Yes |
| description | string | text |  | No |

## Table: geometry_columns
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| f_table_catalog | string | character varying |  | No |
| f_table_schema | string | name |  | No |
| f_table_name | string | name |  | No |
| f_geometry_column | string | name |  | No |
| coord_dimension | integer | integer |  | No |
| srid | integer | integer |  | No |
| type | string | character varying |  | No |

## Table: residents
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | text | Note:
This is a Primary Key.<pk/> | Yes |
| name | string | text |  | Yes |
| dob | string | text |  | No |
| gender | string | text |  | No |
| idCard | string | text |  | No |
| address | string | text |  | No |
| neighborhoodGroup | string | text |  | No |
| status | string | text |  | No |
| phone | string | text |  | No |
| occupation | string | text |  | No |
| note | string | text |  | No |
| classifications | undefined | jsonb |  | No |
| giftHistory | undefined | jsonb |  | No |
| householdId | string | text |  | No |
| partyJoinDate | string | text |  | No |
| partyOfficialDate | string | text |  | No |
| partyPosition | string | text |  | No |
| partyStatus | string | text |  | No |
| groupJoinDate | string | text |  | No |
| groupOfficialDate | string | text |  | No |
| groupPosition | string | text |  | No |
| groupStatus | string | text |  | No |
| created_at | string | timestamp with time zone |  | No |
| updated_at | string | timestamp with time zone |  | No |

## Table: local_news
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| news_code | string | character varying |  | Yes |
| title | string | character varying |  | Yes |
| category | string | character varying |  | No |
| published_date | string | date |  | No |
| author | string | character varying |  | Yes |
| content | string | text |  | Yes |
| is_pinned | boolean | boolean |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: party_meetings
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| title | string | character varying |  | Yes |
| date_time | string | timestamp without time zone |  | Yes |
| location | string | character varying |  | Yes |
| description | string | text |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: audit_logs
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| user_id | string | uuid | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> | No |
| action | string | character varying |  | Yes |
| table_name | string | character varying |  | Yes |
| record_id | string | uuid |  | No |
| old_data | undefined | jsonb |  | No |
| new_data | undefined | jsonb |  | No |
| ip_address | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: households
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| household_code | string | character varying |  | Yes |
| owner_name | string | character varying |  | Yes |
| dia_chi_so_id | string | uuid | Note:
This is a Foreign Key to `dia_chi_so.id`.<fk table='dia_chi_so' column='id'/> | No |
| type | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |
| updated_at | string | timestamp without time zone |  | No |

## Table: temporary_absence
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| citizen_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| leave_date | string | date |  | Yes |
| return_date | string | date |  | No |
| destination_address | string | text |  | Yes |
| reason | string | text |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: beneficiaries
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| citizen_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| category | string | character varying |  | No |
| base_allowance | number | numeric |  | No |
| status | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: party_assignments
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| party_member_id | string | uuid | Note:
This is a Foreign Key to `party_members.id`.<fk table='party_members' column='id'/> | No |
| task_description | string | text |  | Yes |
| start_date | string | date |  | Yes |
| end_date | string | date |  | No |
| status | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: incident_categories
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| code | string | character varying |  | Yes |
| name | string | character varying |  | Yes |
| description | string | text |  | No |

## Table: officers
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| citizen_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| officer_code | string | character varying |  | Yes |
| joining_date | string | date |  | Yes |
| status | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: organization_activities
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| chapter_id | string | uuid | Note:
This is a Foreign Key to `chapters.id`.<fk table='chapters' column='id'/> | No |
| title | string | character varying |  | Yes |
| activity_date | string | date |  | Yes |
| location | string | character varying |  | Yes |
| description | string | text |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: boarding_houses
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| name | string | character varying |  | Yes |
| owner_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| address_id | string | uuid | Note:
This is a Foreign Key to `dia_chi_so.id`.<fk table='dia_chi_so' column='id'/> | No |
| rooms_count | integer | integer |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: business_types
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| code | string | character varying |  | Yes |
| name | string | character varying |  | Yes |
| description | string | text |  | No |

## Table: meetings
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | text | Note:
This is a Primary Key.<pk/> | Yes |
| title | string | text |  | Yes |
| dateTime | string | text |  | No |
| location | string | text |  | No |
| status | string | text |  | No |
| summary | string | text |  | No |
| aiSuggestions | string | text |  | No |
| created_at | string | timestamp with time zone |  | No |
| updated_at | string | timestamp with time zone |  | No |

## Table: geography_columns
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| f_table_catalog | string | name |  | No |
| f_table_schema | string | name |  | No |
| f_table_name | string | name |  | No |
| f_geography_column | string | name |  | No |
| coord_dimension | integer | integer |  | No |
| srid | integer | integer |  | No |
| type | string | text |  | No |

## Table: roles
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| name | string | character varying |  | Yes |
| description | string | text |  | No |

## Table: social_programs
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| title | string | character varying |  | Yes |
| sponsor | string | character varying |  | No |
| budget | number | numeric |  | No |
| description | string | text |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: party_resolutions
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| meeting_id | string | uuid | Note:
This is a Foreign Key to `party_meetings.id`.<fk table='party_meetings' column='id'/> | No |
| title | string | character varying |  | Yes |
| resolution_code | string | character varying |  | No |
| content | string | text |  | Yes |
| publish_date | string | date |  | Yes |
| created_at | string | timestamp without time zone |  | No |

## Table: support_records
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| beneficiary_id | string | uuid | Note:
This is a Foreign Key to `beneficiaries.id`.<fk table='beneficiaries' column='id'/> | No |
| program_id | string | uuid | Note:
This is a Foreign Key to `social_programs.id`.<fk table='social_programs' column='id'/> | No |
| receive_date | string | date |  | No |
| support_type | string | character varying |  | Yes |
| value | number | numeric |  | Yes |
| created_at | string | timestamp without time zone |  | No |

## Table: organizations
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| code | string | character varying |  | Yes |
| name | string | character varying |  | Yes |
| description | string | text |  | No |

## Table: system_health
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| last_ping | string | timestamp with time zone |  | No |
| status | string | character varying |  | No |
| created_at | string | timestamp with time zone |  | No |
| updated_at | string | timestamp with time zone |  | No |

## Table: party_members
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| citizen_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| card_number | string | character varying |  | Yes |
| position | string | character varying |  | No |
| join_date | string | date |  | Yes |
| cell_group | string | character varying |  | Yes |
| status | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: fund_expenditures
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| fund_name | string | character varying |  | No |
| title | string | character varying |  | Yes |
| amount | number | numeric |  | Yes |
| spent_at | string | character varying |  | Yes |
| receiver | string | character varying |  | Yes |
| evidence | string | character varying |  | No |
| approved_by | string | character varying |  | Yes |
| created_at | string | timestamp without time zone |  | No |

## Table: keepalive_logs
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| pinged_at | string | timestamp with time zone |  | No |
| status | string | character varying |  | Yes |
| response_time_ms | integer | integer |  | Yes |
| error_message | string | text |  | No |

## Table: incident_status
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| code | string | character varying |  | Yes |
| name | string | character varying |  | Yes |

## Table: tenants
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| room_id | string | uuid | Note:
This is a Foreign Key to `boarding_rooms.id`.<fk table='boarding_rooms' column='id'/> | No |
| citizen_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| rent_start_date | string | date |  | Yes |
| rent_end_date | string | date |  | No |
| status | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: spatial_ref_sys
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| srid | integer | integer | Note:
This is a Primary Key.<pk/> | Yes |
| auth_name | string | character varying |  | No |
| auth_srid | integer | integer |  | No |
| srtext | string | character varying |  | No |
| proj4text | string | character varying |  | No |

## Table: official_docs
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | text | Note:
This is a Primary Key.<pk/> | Yes |
| title | string | text |  | Yes |
| docNumber | string | text |  | No |
| category | string | text |  | No |
| issuedDate | string | text |  | No |
| department | string | text |  | No |
| summary | string | text |  | No |
| filename | string | text |  | No |
| type | string | text |  | No |
| fileData | string | text |  | No |
| created_at | string | timestamp with time zone |  | No |
| updated_at | string | timestamp with time zone |  | No |

## Table: businesses
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| name | string | character varying |  | Yes |
| tax_code | string | character varying |  | No |
| owner_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| address_id | string | uuid | Note:
This is a Foreign Key to `dia_chi_so.id`.<fk table='dia_chi_so' column='id'/> | No |
| business_type_id | string | uuid | Note:
This is a Foreign Key to `business_types.id`.<fk table='business_types' column='id'/> | No |
| status | string | character varying |  | No |
| employee_count | integer | integer |  | No |
| safety_certified | boolean | boolean |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: inspections
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| business_id | string | uuid | Note:
This is a Foreign Key to `businesses.id`.<fk table='businesses' column='id'/> | No |
| inspector_name | string | character varying |  | Yes |
| inspection_date | string | date |  | Yes |
| result | string | character varying |  | Yes |
| notes | string | text |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: org_categories
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | text | Note:
This is a Primary Key.<pk/> | Yes |
| code | string | text |  | Yes |
| name | string | text |  | Yes |
| icon | string | text |  | No |
| color | string | text |  | No |
| sort_order | integer | integer |  | No |
| is_active | boolean | boolean |  | No |
| created_at | string | timestamp with time zone |  | No |
| updated_at | string | timestamp with time zone |  | No |

## Table: vi_tri_gis
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| dia_chi_so_id | string | uuid | Note:
This is a Foreign Key to `dia_chi_so.id`.<fk table='dia_chi_so' column='id'/> | No |
| geom | string | public.geometry(Point,4326) |  | No |
| latitude | number | numeric |  | No |
| longitude | number | numeric |  | No |

## Table: officer_positions
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| officer_id | string | uuid | Note:
This is a Foreign Key to `officers.id`.<fk table='officers' column='id'/> | No |
| position_name | string | character varying |  | Yes |
| start_date | string | date |  | Yes |
| end_date | string | date |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: chapters
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| organization_id | string | uuid | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> | No |
| name | string | character varying |  | Yes |
| leader_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| created_at | string | timestamp without time zone |  | No |

## Table: dia_chi_so
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| house_number | string | character varying |  | Yes |
| street_name | string | character varying |  | Yes |
| ward | string | character varying |  | No |
| district | string | character varying |  | No |
| city | string | character varying |  | No |
| to_dan_pho_id | string | uuid | Note:
This is a Foreign Key to `to_dan_pho.id`.<fk table='to_dan_pho' column='id'/> | No |
| khu_vuc_id | string | uuid | Note:
This is a Foreign Key to `khu_vuc.id`.<fk table='khu_vuc' column='id'/> | No |

## Table: incidents
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| title | string | character varying |  | Yes |
| category_id | string | uuid | Note:
This is a Foreign Key to `incident_categories.id`.<fk table='incident_categories' column='id'/> | No |
| reporter_name | string | character varying |  | Yes |
| reporter_phone | string | character varying |  | Yes |
| description | string | text |  | Yes |
| address_id | string | uuid | Note:
This is a Foreign Key to `dia_chi_so.id`.<fk table='dia_chi_so' column='id'/> | No |
| geom | string | public.geometry(Point,4326) |  | No |
| latitude | number | numeric |  | No |
| longitude | number | numeric |  | No |
| status_id | string | uuid | Note:
This is a Foreign Key to `incident_status.id`.<fk table='incident_status' column='id'/> | No |
| before_image_url | string | character varying |  | No |
| after_image_url | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: citizens
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| citizen_code | string | character varying |  | Yes |
| full_name | string | character varying |  | Yes |
| gender | string | character varying |  | No |
| date_of_birth | string | date |  | Yes |
| cccd | string | character varying |  | Yes |
| phone | string | character varying |  | No |
| email | string | character varying |  | No |
| household_id | string | uuid | Note:
This is a Foreign Key to `households.id`.<fk table='households' column='id'/> | No |
| permanent_address | string | text |  | No |
| temporary_address | string | text |  | No |
| status | string | character varying |  | No |
| bhyt_code | string | character varying |  | No |
| bhyt_expiry | string | date |  | No |
| registration_date | string | date |  | No |
| created_at | string | timestamp without time zone |  | No |
| updated_at | string | timestamp without time zone |  | No |

## Table: residence_history
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| citizen_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| event_type | string | character varying |  | Yes |
| description | string | text |  | No |
| event_date | string | date |  | No |

## Table: incident_processing
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| incident_id | string | uuid | Note:
This is a Foreign Key to `incidents.id`.<fk table='incidents' column='id'/> | No |
| processor_id | string | uuid | Note:
This is a Foreign Key to `officers.id`.<fk table='officers' column='id'/> | No |
| action_taken | string | text |  | Yes |
| processed_at | string | timestamp without time zone |  | No |
| notes | string | text |  | No |

## Table: officer_tasks
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| officer_id | string | uuid | Note:
This is a Foreign Key to `officers.id`.<fk table='officers' column='id'/> | No |
| title | string | character varying |  | Yes |
| description | string | text |  | No |
| assigner_id | string | uuid | Note:
This is a Foreign Key to `officers.id`.<fk table='officers' column='id'/> | No |
| deadline | string | date |  | Yes |
| status | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: permissions
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| code | string | character varying |  | Yes |
| name | string | character varying |  | Yes |

## Table: community_events
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| event_code | string | character varying |  | Yes |
| title | string | character varying |  | Yes |
| organizer | string | character varying |  | Yes |
| date_time | string | character varying |  | Yes |
| location | string | character varying |  | Yes |
| status | string | character varying |  | No |
| expected_attendees | integer | integer |  | No |
| description | string | text |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: organization_members
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| chapter_id | string | uuid | Note:
This is a Foreign Key to `chapters.id`.<fk table='chapters' column='id'/> | No |
| citizen_id | string | uuid | Note:
This is a Foreign Key to `citizens.id`.<fk table='citizens' column='id'/> | No |
| join_date | string | date |  | Yes |
| status | string | character varying |  | No |
| created_at | string | timestamp without time zone |  | No |

## Table: to_dan_pho
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| code | string | character varying |  | Yes |
| name | string | character varying |  | Yes |

## Table: policy_changelogs
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | text | Note:
This is a Primary Key.<pk/> | Yes |
| user | string | text |  | No |
| action | string | text |  | No |
| time | string | text |  | No |
| created_at | string | timestamp with time zone |  | No |
| updated_at | string | timestamp with time zone |  | No |

## Table: licenses
Description: No description

| Column | Type | Format | Description | Required |
| --- | --- | --- | --- | --- |
| id | string | uuid | Note:
This is a Primary Key.<pk/> | Yes |
| business_id | string | uuid | Note:
This is a Foreign Key to `businesses.id`.<fk table='businesses' column='id'/> | No |
| license_number | string | character varying |  | Yes |
| issue_date | string | date |  | Yes |
| expire_date | string | date |  | No |
| license_type | string | character varying |  | Yes |
| created_at | string | timestamp without time zone |  | No |

