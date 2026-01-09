import { supabase } from '@/lib/supabase';

export interface VerificationResult {
  success: boolean;
  message: string;
}

export class VerificationService {
  /**
   * Approve a pet (Admin only)
   */
  static async approvePet(
    petId: string, 
    adminId: string, 
    notes?: string
  ): Promise<VerificationResult> {
    try {
      const { data, error } = await supabase.rpc('approve_pet', {
        pet_id: petId,
        admin_id: adminId,
        notes: notes || null
      });

      if (error) {
        console.error('Error approving pet:', error);
        return {
          success: false,
          message: error.message || 'Không thể duyệt pet này'
        };
      }

      return {
        success: true,
        message: 'Pet đã được duyệt thành công'
      };
    } catch (error) {
      console.error('Error in approvePet:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi duyệt pet'
      };
    }
  }

  /**
   * Reject a pet (Admin only)
   */
  static async rejectPet(
    petId: string, 
    adminId: string, 
    notes?: string
  ): Promise<VerificationResult> {
    try {
      const { data, error } = await supabase.rpc('reject_pet', {
        pet_id: petId,
        admin_id: adminId,
        notes: notes || null
      });

      if (error) {
        console.error('Error rejecting pet:', error);
        return {
          success: false,
          message: error.message || 'Không thể từ chối pet này'
        };
      }

      return {
        success: true,
        message: 'Pet đã bị từ chối'
      };
    } catch (error) {
      console.error('Error in rejectPet:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi từ chối pet'
      };
    }
  }

  /**
   * Get pets pending verification (Admin only)
   */
  static async getPendingPets() {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          profiles:seller_id (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending pets:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingPets:', error);
      throw error;
    }
  }

  /**
   * Get verification statistics (Admin only)
   */
  static async getVerificationStats() {
    try {
      const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
        supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending'),
        supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'approved'),
        supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'rejected')
      ]);

      return {
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
        total: (pendingResult.count || 0) + (approvedResult.count || 0) + (rejectedResult.count || 0)
      };
    } catch (error) {
      console.error('Error in getVerificationStats:', error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
      };
    }
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return data?.role === 'admin';
    } catch (error) {
      console.error('Error in isAdmin:', error);
      return false;
    }
  }
}