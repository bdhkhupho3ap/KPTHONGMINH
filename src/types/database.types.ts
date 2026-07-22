export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      gis_polygons: {
        Row: {
          id: string
          name: string
          layer_id: string | null
          boundary: string | null
        }
        Insert: {
          id?: string
          name: string
          layer_id?: string | null
          boundary?: string | null
        }
        Update: {
          id?: string
          name?: string
          layer_id?: string | null
          boundary?: string | null
        }
      }
      household_members: {
        Row: {
          household_id: string
          citizen_id: string
          relation_to_owner: string
        }
        Insert: {
          household_id: string
          citizen_id: string
          relation_to_owner: string
        }
        Update: {
          household_id?: string
          citizen_id?: string
          relation_to_owner?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string
          password_hash: string
          full_name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          username: string
          password_hash: string
          full_name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string
          password_hash?: string
          full_name?: string
          created_at?: string | null
        }
      }
      gis_points: {
        Row: {
          id: string
          title: string
          lat: number
          lng: number
          type: string | null
          icon: string | null
          description: string | null
          address: string | null
          notes: string | null
          status: string | null
          image: string | null
          is_deleted: boolean | null
          created_by: string | null
          created_at: string | null
          updated_by: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          lat: number
          lng: number
          type?: string | null
          icon?: string | null
          description?: string | null
          address?: string | null
          notes?: string | null
          status?: string | null
          image?: string | null
          is_deleted?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          lat?: number
          lng?: number
          type?: string | null
          icon?: string | null
          description?: string | null
          address?: string | null
          notes?: string | null
          status?: string | null
          image?: string | null
          is_deleted?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_by?: string | null
          updated_at?: string | null
        }
      }
      attachments: {
        Row: {
          id: string
          document_id: string | null
          file_name: string
          file_url: string
        }
        Insert: {
          id?: string
          document_id?: string | null
          file_name: string
          file_url: string
        }
        Update: {
          id?: string
          document_id?: string | null
          file_name?: string
          file_url?: string
        }
      }
      welfare_programs: {
        Row: {
          id: string
          name: string
          description: string | null
          support_level: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          support_level: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          support_level?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string | null
          permission_id: string | null
        }
        Insert: {
          id?: string
          role_id?: string | null
          permission_id?: string | null
        }
        Update: {
          id?: string
          role_id?: string | null
          permission_id?: string | null
        }
      }
      plans: {
        Row: {
          id: string
          title: string
          deadline: string | null
          status: string | null
          aiContent: string | null
          attachedFile: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          deadline?: string | null
          status?: string | null
          aiContent?: string | null
          attachedFile?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          deadline?: string | null
          status?: string | null
          aiContent?: string | null
          attachedFile?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      temporary_residence: {
        Row: {
          id: string
          citizen_id: string | null
          household_id: string | null
          start_date: string
          end_date: string
          registration_number: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          household_id?: string | null
          start_date: string
          end_date: string
          registration_number?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          citizen_id?: string | null
          household_id?: string | null
          start_date?: string
          end_date?: string
          registration_number?: string | null
          created_at?: string | null
        }
      }
      boarding_rooms: {
        Row: {
          id: string
          boarding_house_id: string | null
          room_number: string
          price: number
          max_tenants: number | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          boarding_house_id?: string | null
          room_number: string
          price: number
          max_tenants?: number | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          boarding_house_id?: string | null
          room_number?: string
          price?: number
          max_tenants?: number | null
          status?: string | null
          created_at?: string | null
        }
      }
      officer_evaluations: {
        Row: {
          id: string
          officer_id: string | null
          year: number
          rating: string
          achievements: string | null
          feedback: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          officer_id?: string | null
          year: number
          rating: string
          achievements?: string | null
          feedback?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          officer_id?: string | null
          year?: number
          rating?: string
          achievements?: string | null
          feedback?: string | null
          created_at?: string | null
        }
      }
      fund_contributions: {
        Row: {
          id: string
          household_code: string
          owner_name: string
          fund_name: string | null
          amount: number
          status: string | null
          paid_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          household_code: string
          owner_name: string
          fund_name?: string | null
          amount: number
          status?: string | null
          paid_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          household_code?: string
          owner_name?: string
          fund_name?: string | null
          amount?: number
          status?: string | null
          paid_at?: string | null
          created_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          content: string
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          content: string
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          content?: string
          is_read?: boolean | null
          created_at?: string | null
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role_id: string
        }
        Insert: {
          user_id: string
          role_id: string
        }
        Update: {
          user_id?: string
          role_id?: string
        }
      }
      khu_vuc: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      geometry_columns: {
        Row: {
          f_table_catalog: string | null
          f_table_schema: string | null
          f_table_name: string | null
          f_geometry_column: string | null
          coord_dimension: number | null
          srid: number | null
          type: string | null
        }
        Insert: {
          f_table_catalog?: string | null
          f_table_schema?: string | null
          f_table_name?: string | null
          f_geometry_column?: string | null
          coord_dimension?: number | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          f_table_catalog?: string | null
          f_table_schema?: string | null
          f_table_name?: string | null
          f_geometry_column?: string | null
          coord_dimension?: number | null
          srid?: number | null
          type?: string | null
        }
      }
      residents: {
        Row: {
          id: string
          name: string
          dob: string | null
          gender: string | null
          idCard: string | null
          address: string | null
          neighborhoodGroup: string | null
          status: string | null
          phone: string | null
          occupation: string | null
          note: string | null
          classifications: any | null
          giftHistory: any | null
          householdId: string | null
          partyJoinDate: string | null
          partyOfficialDate: string | null
          partyPosition: string | null
          partyStatus: string | null
          groupJoinDate: string | null
          groupOfficialDate: string | null
          groupPosition: string | null
          groupStatus: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          dob?: string | null
          gender?: string | null
          idCard?: string | null
          address?: string | null
          neighborhoodGroup?: string | null
          status?: string | null
          phone?: string | null
          occupation?: string | null
          note?: string | null
          classifications?: any | null
          giftHistory?: any | null
          householdId?: string | null
          partyJoinDate?: string | null
          partyOfficialDate?: string | null
          partyPosition?: string | null
          partyStatus?: string | null
          groupJoinDate?: string | null
          groupOfficialDate?: string | null
          groupPosition?: string | null
          groupStatus?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          dob?: string | null
          gender?: string | null
          idCard?: string | null
          address?: string | null
          neighborhoodGroup?: string | null
          status?: string | null
          phone?: string | null
          occupation?: string | null
          note?: string | null
          classifications?: any | null
          giftHistory?: any | null
          householdId?: string | null
          partyJoinDate?: string | null
          partyOfficialDate?: string | null
          partyPosition?: string | null
          partyStatus?: string | null
          groupJoinDate?: string | null
          groupOfficialDate?: string | null
          groupPosition?: string | null
          groupStatus?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      local_news: {
        Row: {
          id: string
          news_code: string
          title: string
          category: string | null
          published_date: string | null
          author: string
          content: string
          is_pinned: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          news_code: string
          title: string
          category?: string | null
          published_date?: string | null
          author: string
          content: string
          is_pinned?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          news_code?: string
          title?: string
          category?: string | null
          published_date?: string | null
          author?: string
          content?: string
          is_pinned?: boolean | null
          created_at?: string | null
        }
      }
      unions: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      party_meetings: {
        Row: {
          id: string
          title: string
          date_time: string
          location: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          date_time: string
          location: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          date_time?: string
          location?: string
          description?: string | null
          created_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_data: any | null
          new_data: any | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name?: string | null
          record_id?: string | null
          old_data?: any | null
          new_data?: any | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string | null
          record_id?: string | null
          old_data?: any | null
          new_data?: any | null
          created_at?: string | null
        }
      }
      memberships: {
        Row: {
          id: string
          citizen_id: string | null
          organization_id: string | null
          role: string
          join_date: string
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          organization_id?: string | null
          role: string
          join_date: string
        }
        Update: {
          id?: string
          citizen_id?: string | null
          organization_id?: string | null
          role?: string
          join_date?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          activity: string
          ip_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          activity: string
          ip_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          activity?: string
          ip_address?: string | null
          created_at?: string | null
        }
      }
      households: {
        Row: {
          id: string
          code: string
          owner_name: string
          address: string
          member_count: number | null
          type: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          code: string
          owner_name: string
          address: string
          member_count?: number | null
          type?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          owner_name?: string
          address?: string
          member_count?: number | null
          type?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
        }
      }
      temporary_absence: {
        Row: {
          id: string
          citizen_id: string | null
          leave_date: string
          return_date: string | null
          destination_address: string
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          leave_date: string
          return_date?: string | null
          destination_address: string
          reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          citizen_id?: string | null
          leave_date?: string
          return_date?: string | null
          destination_address?: string
          reason?: string | null
          created_at?: string | null
        }
      }
      beneficiaries: {
        Row: {
          id: string
          citizen_id: string | null
          category: string | null
          base_allowance: number | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          category?: string | null
          base_allowance?: number | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          citizen_id?: string | null
          category?: string | null
          base_allowance?: number | null
          status?: string | null
          created_at?: string | null
        }
      }
      citizen_addresses: {
        Row: {
          id: string
          citizen_id: string | null
          address_type: string | null
          address_text: string
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          address_type?: string | null
          address_text: string
        }
        Update: {
          id?: string
          citizen_id?: string | null
          address_type?: string | null
          address_text?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          category_id: string | null
          content: string | null
          publish_date: string
          status: string | null
        }
        Insert: {
          id?: string
          title: string
          category_id?: string | null
          content?: string | null
          publish_date: string
          status?: string | null
        }
        Update: {
          id?: string
          title?: string
          category_id?: string | null
          content?: string | null
          publish_date?: string
          status?: string | null
        }
      }
      document_categories: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      party_assignments: {
        Row: {
          id: string
          party_member_id: string | null
          task_description: string
          start_date: string
          end_date: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          party_member_id?: string | null
          task_description: string
          start_date: string
          end_date?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          party_member_id?: string | null
          task_description?: string
          start_date?: string
          end_date?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      incident_categories: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
        }
      }
      officers: {
        Row: {
          id: string
          citizen_id: string | null
          position: string
          committee_id: string | null
          start_date: string
          end_date: string | null
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          position: string
          committee_id?: string | null
          start_date: string
          end_date?: string | null
        }
        Update: {
          id?: string
          citizen_id?: string | null
          position?: string
          committee_id?: string | null
          start_date?: string
          end_date?: string | null
        }
      }
      union_members: {
        Row: {
          union_id: string
          citizen_id: string
          join_date: string
        }
        Insert: {
          union_id: string
          citizen_id: string
          join_date: string
        }
        Update: {
          union_id?: string
          citizen_id?: string
          join_date?: string
        }
      }
      organization_activities: {
        Row: {
          id: string
          chapter_id: string | null
          title: string
          activity_date: string
          location: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          chapter_id?: string | null
          title: string
          activity_date: string
          location: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          chapter_id?: string | null
          title?: string
          activity_date?: string
          location?: string
          description?: string | null
          created_at?: string | null
        }
      }
      citizen_timelines: {
        Row: {
          id: string
          citizen_id: string | null
          event_name: string
          event_date: string
          description: string | null
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          event_name: string
          event_date: string
          description?: string | null
        }
        Update: {
          id?: string
          citizen_id?: string | null
          event_name?: string
          event_date?: string
          description?: string | null
        }
      }
      boarding_houses: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          address_id: string | null
          rooms_count: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          address_id?: string | null
          rooms_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string | null
          address_id?: string | null
          rooms_count?: number | null
          created_at?: string | null
        }
      }
      business_types: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      meetings: {
        Row: {
          id: string
          title: string
          dateTime: string | null
          location: string | null
          status: string | null
          summary: string | null
          aiSuggestions: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          dateTime?: string | null
          location?: string | null
          status?: string | null
          summary?: string | null
          aiSuggestions?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          dateTime?: string | null
          location?: string | null
          status?: string | null
          summary?: string | null
          aiSuggestions?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      geography_columns: {
        Row: {
          f_table_catalog: string | null
          f_table_schema: string | null
          f_table_name: string | null
          f_geography_column: string | null
          coord_dimension: number | null
          srid: number | null
          type: string | null
        }
        Insert: {
          f_table_catalog?: string | null
          f_table_schema?: string | null
          f_table_name?: string | null
          f_geography_column?: string | null
          coord_dimension?: number | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          f_table_catalog?: string | null
          f_table_schema?: string | null
          f_table_name?: string | null
          f_geography_column?: string | null
          coord_dimension?: number | null
          srid?: number | null
          type?: string | null
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string | null
          title: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          created_at?: string | null
        }
      }
      social_programs: {
        Row: {
          id: string
          title: string
          sponsor: string | null
          budget: number | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          sponsor?: string | null
          budget?: number | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          sponsor?: string | null
          budget?: number | null
          description?: string | null
          created_at?: string | null
        }
      }
      party_resolutions: {
        Row: {
          id: string
          meeting_id: string | null
          title: string
          resolution_code: string | null
          content: string
          publish_date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          meeting_id?: string | null
          title: string
          resolution_code?: string | null
          content: string
          publish_date: string
          created_at?: string | null
        }
        Update: {
          id?: string
          meeting_id?: string | null
          title?: string
          resolution_code?: string | null
          content?: string
          publish_date?: string
          created_at?: string | null
        }
      }
      support_records: {
        Row: {
          id: string
          beneficiary_id: string | null
          program_id: string | null
          receive_date: string | null
          support_type: string
          value: number
          created_at: string | null
        }
        Insert: {
          id?: string
          beneficiary_id?: string | null
          program_id?: string | null
          receive_date?: string | null
          support_type: string
          value: number
          created_at?: string | null
        }
        Update: {
          id?: string
          beneficiary_id?: string | null
          program_id?: string | null
          receive_date?: string | null
          support_type?: string
          value?: number
          created_at?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      system_health: {
        Row: {
          id: string
          last_ping: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          last_ping?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          last_ping?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      party_members: {
        Row: {
          id: string
          citizen_id: string | null
          party_branch_id: string | null
          party_card_number: string
          position: string
          join_date: string
          status: string | null
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          party_branch_id?: string | null
          party_card_number: string
          position: string
          join_date: string
          status?: string | null
        }
        Update: {
          id?: string
          citizen_id?: string | null
          party_branch_id?: string | null
          party_card_number?: string
          position?: string
          join_date?: string
          status?: string | null
        }
      }
      gis_layers: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      welfare_beneficiaries: {
        Row: {
          program_id: string
          citizen_id: string
          status: string | null
          notes: string | null
        }
        Insert: {
          program_id: string
          citizen_id: string
          status?: string | null
          notes?: string | null
        }
        Update: {
          program_id?: string
          citizen_id?: string
          status?: string | null
          notes?: string | null
        }
      }
      gis_markers: {
        Row: {
          id: string
          location_id: string | null
          marker_type: string
          icon_url: string | null
        }
        Insert: {
          id?: string
          location_id?: string | null
          marker_type: string
          icon_url?: string | null
        }
        Update: {
          id?: string
          location_id?: string | null
          marker_type?: string
          icon_url?: string | null
        }
      }
      fund_expenditures: {
        Row: {
          id: string
          fund_name: string | null
          title: string
          amount: number
          spent_at: string
          receiver: string
          evidence: string | null
          approved_by: string
          created_at: string | null
        }
        Insert: {
          id?: string
          fund_name?: string | null
          title: string
          amount: number
          spent_at: string
          receiver: string
          evidence?: string | null
          approved_by: string
          created_at?: string | null
        }
        Update: {
          id?: string
          fund_name?: string | null
          title?: string
          amount?: number
          spent_at?: string
          receiver?: string
          evidence?: string | null
          approved_by?: string
          created_at?: string | null
        }
      }
      keepalive_logs: {
        Row: {
          id: string
          pinged_at: string | null
          status: string
          response_time_ms: number
          error_message: string | null
        }
        Insert: {
          id?: string
          pinged_at?: string | null
          status: string
          response_time_ms: number
          error_message?: string | null
        }
        Update: {
          id?: string
          pinged_at?: string | null
          status?: string
          response_time_ms?: number
          error_message?: string | null
        }
      }
      incident_status: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      tenants: {
        Row: {
          id: string
          room_id: string | null
          citizen_id: string | null
          rent_start_date: string
          rent_end_date: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          room_id?: string | null
          citizen_id?: string | null
          rent_start_date: string
          rent_end_date?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          room_id?: string | null
          citizen_id?: string | null
          rent_start_date?: string
          rent_end_date?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      spatial_ref_sys: {
        Row: {
          srid: number
          auth_name: string | null
          auth_srid: number | null
          srtext: string | null
          proj4text: string | null
        }
        Insert: {
          srid: number
          auth_name?: string | null
          auth_srid?: number | null
          srtext?: string | null
          proj4text?: string | null
        }
        Update: {
          srid?: number
          auth_name?: string | null
          auth_srid?: number | null
          srtext?: string | null
          proj4text?: string | null
        }
      }
      official_docs: {
        Row: {
          id: string
          title: string
          docNumber: string | null
          category: string | null
          issuedDate: string | null
          department: string | null
          summary: string | null
          filename: string | null
          type: string | null
          fileData: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          docNumber?: string | null
          category?: string | null
          issuedDate?: string | null
          department?: string | null
          summary?: string | null
          filename?: string | null
          type?: string | null
          fileData?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          docNumber?: string | null
          category?: string | null
          issuedDate?: string | null
          department?: string | null
          summary?: string | null
          filename?: string | null
          type?: string | null
          fileData?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      businesses: {
        Row: {
          id: string
          name: string
          type_id: string | null
          owner_citizen_id: string | null
          phone: string | null
          address: string
          status: string | null
          employee_count: number | null
          safety_certified: boolean | null
          location: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          name: string
          type_id?: string | null
          owner_citizen_id?: string | null
          phone?: string | null
          address: string
          status?: string | null
          employee_count?: number | null
          safety_certified?: boolean | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          name?: string
          type_id?: string | null
          owner_citizen_id?: string | null
          phone?: string | null
          address?: string
          status?: string | null
          employee_count?: number | null
          safety_certified?: boolean | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
        }
      }
      inspections: {
        Row: {
          id: string
          business_id: string | null
          inspector_name: string
          inspection_date: string
          result: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          business_id?: string | null
          inspector_name: string
          inspection_date: string
          result: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string | null
          inspector_name?: string
          inspection_date?: string
          result?: string
          notes?: string | null
          created_at?: string | null
        }
      }
      incident_images: {
        Row: {
          id: string
          incident_id: string | null
          image_url: string
          type: string | null
        }
        Insert: {
          id?: string
          incident_id?: string | null
          image_url: string
          type?: string | null
        }
        Update: {
          id?: string
          incident_id?: string | null
          image_url?: string
          type?: string | null
        }
      }
      party_branches: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      ai_prompts: {
        Row: {
          id: string
          name: string
          prompt_text: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          prompt_text: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          prompt_text?: string
          description?: string | null
        }
      }
      org_categories: {
        Row: {
          id: string
          code: string
          name: string
          icon: string | null
          color: string | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          icon?: string | null
          color?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          icon?: string | null
          color?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      vi_tri_gis: {
        Row: {
          id: string
          dia_chi_so_id: string | null
          geom: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          dia_chi_so_id?: string | null
          geom?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          dia_chi_so_id?: string | null
          geom?: string | null
          latitude?: number | null
          longitude?: number | null
        }
      }
      officer_positions: {
        Row: {
          id: string
          officer_id: string | null
          position_name: string
          start_date: string
          end_date: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          officer_id?: string | null
          position_name: string
          start_date: string
          end_date?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          officer_id?: string | null
          position_name?: string
          start_date?: string
          end_date?: string | null
          created_at?: string | null
        }
      }
      citizen_documents: {
        Row: {
          id: string
          citizen_id: string | null
          doc_type: string
          doc_number: string
          issued_at: string | null
          file_url: string | null
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          doc_type: string
          doc_number: string
          issued_at?: string | null
          file_url?: string | null
        }
        Update: {
          id?: string
          citizen_id?: string | null
          doc_type?: string
          doc_number?: string
          issued_at?: string | null
          file_url?: string | null
        }
      }
      chapters: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          leader_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          leader_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          leader_id?: string | null
          created_at?: string | null
        }
      }
      dia_chi_so: {
        Row: {
          id: string
          house_number: string
          street_name: string
          ward: string | null
          district: string | null
          city: string | null
          to_dan_pho_id: string | null
          khu_vuc_id: string | null
        }
        Insert: {
          id?: string
          house_number: string
          street_name: string
          ward?: string | null
          district?: string | null
          city?: string | null
          to_dan_pho_id?: string | null
          khu_vuc_id?: string | null
        }
        Update: {
          id?: string
          house_number?: string
          street_name?: string
          ward?: string | null
          district?: string | null
          city?: string | null
          to_dan_pho_id?: string | null
          khu_vuc_id?: string | null
        }
      }
      incidents: {
        Row: {
          id: string
          title: string
          category: string
          reporter_citizen_id: string | null
          reporter_name: string
          reporter_phone: string
          description: string
          status_id: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          timeline: any | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          category: string
          reporter_citizen_id?: string | null
          reporter_name: string
          reporter_phone: string
          description: string
          status_id?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          timeline?: any | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          category?: string
          reporter_citizen_id?: string | null
          reporter_name?: string
          reporter_phone?: string
          description?: string
          status_id?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          timeline?: any | null
          created_at?: string | null
        }
      }
      citizens: {
        Row: {
          id: string
          full_name: string
          gender: string | null
          birth_date: string
          cccd: string
          phone: string | null
          status: string | null
          occupation: string | null
          avatar_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          full_name: string
          gender?: string | null
          birth_date: string
          cccd: string
          phone?: string | null
          status?: string | null
          occupation?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          gender?: string | null
          birth_date?: string
          cccd?: string
          phone?: string | null
          status?: string | null
          occupation?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
      }
      business_licenses: {
        Row: {
          id: string
          business_id: string | null
          license_number: string
          issued_date: string
          expiry_date: string | null
        }
        Insert: {
          id?: string
          business_id?: string | null
          license_number: string
          issued_date: string
          expiry_date?: string | null
        }
        Update: {
          id?: string
          business_id?: string | null
          license_number?: string
          issued_date?: string
          expiry_date?: string | null
        }
      }
      gis_locations: {
        Row: {
          id: string
          name: string
          layer_id: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          name: string
          layer_id?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          name?: string
          layer_id?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
        }
      }
      residence_history: {
        Row: {
          id: string
          citizen_id: string | null
          event_type: string
          description: string | null
          event_date: string | null
        }
        Insert: {
          id?: string
          citizen_id?: string | null
          event_type: string
          description?: string | null
          event_date?: string | null
        }
        Update: {
          id?: string
          citizen_id?: string | null
          event_type?: string
          description?: string | null
          event_date?: string | null
        }
      }
      incident_processing: {
        Row: {
          id: string
          incident_id: string | null
          processor_id: string | null
          action_taken: string
          processed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          incident_id?: string | null
          processor_id?: string | null
          action_taken: string
          processed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          incident_id?: string | null
          processor_id?: string | null
          action_taken?: string
          processed_at?: string | null
          notes?: string | null
        }
      }
      officer_tasks: {
        Row: {
          id: string
          officer_id: string | null
          title: string
          description: string | null
          assigner_id: string | null
          deadline: string
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          officer_id?: string | null
          title: string
          description?: string | null
          assigner_id?: string | null
          deadline: string
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          officer_id?: string | null
          title?: string
          description?: string | null
          assigner_id?: string | null
          deadline?: string
          status?: string | null
          created_at?: string | null
        }
      }
      permissions: {
        Row: {
          id: string
          code: string
          description: string | null
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
        }
      }
      community_events: {
        Row: {
          id: string
          event_code: string
          title: string
          organizer: string
          date_time: string
          location: string
          status: string | null
          expected_attendees: number | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          event_code: string
          title: string
          organizer: string
          date_time: string
          location: string
          status?: string | null
          expected_attendees?: number | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          event_code?: string
          title?: string
          organizer?: string
          date_time?: string
          location?: string
          status?: string | null
          expected_attendees?: number | null
          description?: string | null
          created_at?: string | null
        }
      }
      organization_members: {
        Row: {
          id: string
          chapter_id: string | null
          citizen_id: string | null
          join_date: string
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          chapter_id?: string | null
          citizen_id?: string | null
          join_date: string
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          chapter_id?: string | null
          citizen_id?: string | null
          join_date?: string
          status?: string | null
          created_at?: string | null
        }
      }
      to_dan_pho: {
        Row: {
          id: string
          code: string
          name: string
        }
        Insert: {
          id?: string
          code: string
          name: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
        }
      }
      ai_logs: {
        Row: {
          id: string
          conversation_id: string | null
          user_message: string
          ai_response: string
          tokens_used: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          user_message: string
          ai_response: string
          tokens_used?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string | null
          user_message?: string
          ai_response?: string
          tokens_used?: number | null
          created_at?: string | null
        }
      }
      policy_changelogs: {
        Row: {
          id: string
          user: string | null
          action: string | null
          time: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user?: string | null
          action?: string | null
          time?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user?: string | null
          action?: string | null
          time?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      licenses: {
        Row: {
          id: string
          business_id: string | null
          license_number: string
          issue_date: string
          expire_date: string | null
          license_type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          business_id?: string | null
          license_number: string
          issue_date: string
          expire_date?: string | null
          license_type: string
          created_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string | null
          license_number?: string
          issue_date?: string
          expire_date?: string | null
          license_type?: string
          created_at?: string | null
        }
      }
      committees: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      business_members: {
        Row: {
          business_id: string
          citizen_id: string
          role: string | null
        }
        Insert: {
          business_id: string
          citizen_id: string
          role?: string | null
        }
        Update: {
          business_id?: string
          citizen_id?: string
          role?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
