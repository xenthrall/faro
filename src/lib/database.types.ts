export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: number
          name: string
          parent_id: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: never
          name: string
          parent_id?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: never
          name?: string
          parent_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          email: string | null
          id: number
          name: string
          notes: string | null
          phone: string | null
          price_list_id: number | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          email?: string | null
          id?: never
          name: string
          notes?: string | null
          phone?: string | null
          price_list_id?: number | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          email?: string | null
          id?: never
          name?: string
          notes?: string | null
          phone?: string | null
          price_list_id?: number | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          created_at: string
          id: number
          location_id: number
          lot_id: number | null
          product_id: number
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          location_id: number
          lot_id?: number | null
          product_id: number
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          location_id?: number
          lot_id?: number | null
          product_id?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_lot_matches_product"
            columns: ["lot_id", "product_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id", "product_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["product_id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          created_at: string
          expiration_date: string | null
          id: number
          lot_number: string | null
          notes: string | null
          product_id: number
          received_at: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          id?: never
          lot_number?: string | null
          notes?: string | null
          product_id: number
          received_at?: string
          unit_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          id?: never
          lot_number?: string | null
          notes?: string | null
          product_id?: number
          received_at?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["product_id"]
          },
        ]
      }
      inventory_movement_items: {
        Row: {
          created_at: string
          id: number
          location_id: number
          lot_id: number | null
          movement_id: number
          product_id: number
          quantity: number
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: never
          location_id: number
          lot_id?: number | null
          movement_id: number
          product_id: number
          quantity: number
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: never
          location_id?: number
          lot_id?: number | null
          movement_id?: number
          product_id?: number
          quantity?: number
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movement_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movement_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_movement_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_movement_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_movement_items_lot_matches_product"
            columns: ["lot_id", "product_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id", "product_id"]
          },
          {
            foreignKeyName: "inventory_movement_items_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movement_items_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["movement_id"]
          },
          {
            foreignKeyName: "inventory_movement_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movement_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_movement_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_movement_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_movement_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["product_id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          date: string
          id: number
          notes: string | null
          reference_id: number | null
          reference_type: Database["public"]["Enums"]["document_type"] | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: never
          notes?: string | null
          reference_id?: number | null
          reference_type?: Database["public"]["Enums"]["document_type"] | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: never
          notes?: string | null
          reference_id?: number | null
          reference_type?: Database["public"]["Enums"]["document_type"] | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: []
      }
      inventory_transfer_items: {
        Row: {
          created_at: string
          id: number
          lot_id: number | null
          product_id: number
          quantity: number
          transfer_id: number
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: never
          lot_id?: number | null
          product_id: number
          quantity: number
          transfer_id: number
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: never
          lot_id?: number | null
          product_id?: number
          quantity?: number
          transfer_id?: number
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfer_items_lot_matches_product"
            columns: ["lot_id", "product_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id", "product_id"]
          },
          {
            foreignKeyName: "inventory_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "inventory_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfers: {
        Row: {
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          date: string
          destination_location_id: number
          id: number
          notes: string | null
          reference: string | null
          source_location_id: number
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          destination_location_id: number
          id?: never
          notes?: string | null
          reference?: string | null
          source_location_id: number
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          destination_location_id?: number
          id?: never
          notes?: string | null
          reference?: string | null
          source_location_id?: number
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfers_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_transfers_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_transfers_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["location_id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: number
          is_default: boolean
          name: string
          type: Database["public"]["Enums"]["location_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: never
          is_default?: boolean
          name: string
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: never
          is_default?: boolean
          name?: string
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Relationships: []
      }
      price_lists: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: number
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: never
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: never
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_prices: {
        Row: {
          created_at: string
          id: number
          price: number
          price_list_id: number
          product_id: number
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          price: number
          price_list_id: number
          product_id: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          price?: number
          price_list_id?: number
          product_id?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          barcode: string | null
          category_id: number | null
          created_at: string
          description: string | null
          id: number
          min_stock: number | null
          name: string
          sku: string
          tax_rate: number
          track_expiration: boolean
          track_lot: boolean
          unit_id: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: never
          min_stock?: number | null
          name: string
          sku: string
          tax_rate?: number
          track_expiration?: boolean
          track_lot?: boolean
          unit_id: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          barcode?: string | null
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: never
          min_stock?: number | null
          name?: string
          sku?: string
          tax_rate?: number
          track_expiration?: boolean
          track_lot?: boolean
          unit_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          created_at: string
          id: number
          lot_id: number | null
          product_id: number
          purchase_id: number
          quantity: number
          subtotal: number | null
          tax: number | null
          tax_rate: number
          total: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: never
          lot_id?: number | null
          product_id: number
          purchase_id: number
          quantity: number
          subtotal?: number | null
          tax?: number | null
          tax_rate?: number
          total?: number | null
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: never
          lot_id?: number | null
          product_id?: number
          purchase_id?: number
          quantity?: number
          subtotal?: number | null
          tax?: number | null
          tax_rate?: number
          total?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_lot_matches_product"
            columns: ["lot_id", "product_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id", "product_id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          date: string
          id: number
          location_id: number
          notes: string | null
          reference: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          supplier_id: number | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: never
          location_id: number
          notes?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          supplier_id?: number | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: never
          location_id?: number
          notes?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          supplier_id?: number | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "purchases_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "purchases_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: number
          lot_id: number | null
          product_id: number
          quantity: number
          sale_id: number
          subtotal: number | null
          tax: number | null
          tax_rate: number
          total: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: never
          lot_id?: number | null
          product_id: number
          quantity: number
          sale_id: number
          subtotal?: number | null
          tax?: number | null
          tax_rate?: number
          total?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: never
          lot_id?: number | null
          product_id?: number
          quantity?: number
          sale_id?: number
          subtotal?: number | null
          tax?: number | null
          tax_rate?: number
          total?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_lot_matches_product"
            columns: ["lot_id", "product_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id", "product_id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: number | null
          date: string
          id: number
          location_id: number
          notes: string | null
          reference: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          date?: string
          id?: never
          location_id: number
          notes?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          date?: string
          id?: never
          location_id?: number
          notes?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["location_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          email: string | null
          id: number
          name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          email?: string | null
          id?: never
          name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          email?: string | null
          id?: never
          name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          active: boolean
          allows_fractions: boolean
          code: string
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          allows_fractions?: boolean
          code: string
          created_at?: string
          id?: never
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          allows_fractions?: boolean
          code?: string
          created_at?: string
          id?: never
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_current_prices: {
        Row: {
          is_default_list: boolean | null
          price: number | null
          price_list_code: string | null
          price_list_id: number | null
          price_with_tax: number | null
          product_id: number | null
          product_name: string | null
          sku: string | null
          tax_rate: number | null
          valid_from: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["product_id"]
          },
        ]
      }
      v_expiring_stock: {
        Row: {
          days_to_expiration: number | null
          expiration_date: string | null
          expiration_status: string | null
          location_id: number | null
          location_name: string | null
          lot_id: number | null
          lot_number: string | null
          product_id: number | null
          product_name: string | null
          quantity: number | null
          sku: string | null
          stock_value: number | null
          unit_cost: number | null
        }
        Relationships: []
      }
      v_inventory_ledger: {
        Row: {
          applied_at: string | null
          date: string | null
          item_id: number | null
          location_id: number | null
          location_name: string | null
          lot_id: number | null
          lot_number: string | null
          movement_id: number | null
          movement_type: Database["public"]["Enums"]["movement_type"] | null
          notes: string | null
          product_id: number | null
          product_name: string | null
          quantity: number | null
          reference_id: number | null
          reference_type: Database["public"]["Enums"]["document_type"] | null
          sku: string | null
          unit_cost: number | null
          value_change: number | null
        }
        Relationships: []
      }
      v_product_stock: {
        Row: {
          below_min_stock: boolean | null
          category_name: string | null
          min_stock: number | null
          product_id: number | null
          product_name: string | null
          sku: string | null
          total_quantity: number | null
          total_value: number | null
          unit_code: string | null
          weighted_average_cost: number | null
        }
        Relationships: []
      }
      v_stock_by_location: {
        Row: {
          location_code: string | null
          location_id: number | null
          location_name: string | null
          product_id: number | null
          product_name: string | null
          quantity: number | null
          sku: string | null
          stock_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_ledger"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_by_lot"
            referencedColumns: ["product_id"]
          },
        ]
      }
      v_stock_by_lot: {
        Row: {
          expiration_date: string | null
          inventory_id: number | null
          location_code: string | null
          location_id: number | null
          location_name: string | null
          lot_id: number | null
          lot_number: string | null
          product_id: number | null
          product_name: string | null
          quantity: number | null
          received_at: string | null
          sku: string | null
          stock_value: number | null
          unit_code: string | null
          unit_cost: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_inventory: {
        Args: {
          p_location_id: number
          p_lot_id?: number
          p_notes?: string
          p_product_id: number
          p_quantity: number
          p_type?: Database["public"]["Enums"]["movement_type"]
          p_unit_cost?: number
        }
        Returns: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          date: string
          id: number
          notes: string | null
          reference_id: number | null
          reference_type: Database["public"]["Enums"]["document_type"] | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      allocate_stock: {
        Args: {
          p_location_id: number
          p_product_id: number
          p_quantity: number
        }
        Returns: {
          lot_id: number
          quantity: number
        }[]
      }
      apply_inventory_movement: {
        Args: { p_movement_id: number }
        Returns: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          date: string
          id: number
          notes: string | null
          reference_id: number | null
          reference_type: Database["public"]["Enums"]["document_type"] | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_purchase: {
        Args: { p_purchase_id: number }
        Returns: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          date: string
          id: number
          notes: string | null
          reference_id: number | null
          reference_type: Database["public"]["Enums"]["document_type"] | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_sale: {
        Args: { p_sale_id: number }
        Returns: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          date: string
          id: number
          notes: string | null
          reference_id: number | null
          reference_type: Database["public"]["Enums"]["document_type"] | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_transfer: {
        Args: { p_transfer_id: number }
        Returns: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          date: string
          id: number
          notes: string | null
          reference_id: number | null
          reference_type: Database["public"]["Enums"]["document_type"] | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_product_price: {
        Args: {
          p_price: number
          p_price_list_id?: number
          p_product_id: number
        }
        Returns: {
          created_at: string
          id: number
          price: number
          price_list_id: number
          product_id: number
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        SetofOptions: {
          from: "*"
          to: "product_prices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_inventory_integrity: {
        Args: never
        Returns: {
          difference: number
          inventory_qty: number
          location_id: number
          lot_id: number
          movements_qty: number
          product_id: number
        }[]
      }
    }
    Enums: {
      document_status: "draft" | "confirmed" | "cancelled"
      document_type: "purchase" | "sale" | "transfer" | "manual"
      location_type:
        | "warehouse"
        | "store"
        | "pos"
        | "dispatch"
        | "production"
        | "other"
      movement_type:
        | "initial_stock"
        | "purchase"
        | "sale"
        | "transfer"
        | "adjustment"
        | "return"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      document_status: ["draft", "confirmed", "cancelled"],
      document_type: ["purchase", "sale", "transfer", "manual"],
      location_type: [
        "warehouse",
        "store",
        "pos",
        "dispatch",
        "production",
        "other",
      ],
      movement_type: [
        "initial_stock",
        "purchase",
        "sale",
        "transfer",
        "adjustment",
        "return",
      ],
    },
  },
} as const

