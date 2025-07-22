import { Copy, Eye, Search, Share2, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import BinaryTreeVisualization from "../components/BinaryTree/BinaryTreeVisualization";
import { User } from "../types";
import { getCurrentUser } from "../utils/auth";
import { supabase } from '../lib/supabase';

const Referrals: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [referrals, setReferrals] = useState<User[]>([]);
  const [showTree, setShowTree] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchUserAndReferrals = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadReferrals(currentUser.id);
      }
    };
    const loadReferrals = async (userId: string) => {
      const { data: users, error } = await supabase.from('profiles').select('*');
      if (!error && users) {
        setReferrals(users.filter((u: any) => u.sponsor_id === userId));
      }
    };
    fetchUserAndReferrals();
    interval = setInterval(fetchUserAndReferrals, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.gpk_id.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "active") return matchesSearch && referral.is_active;
    if (filter === "inactive") return matchesSearch && !referral.is_active;
    if (filter === "right") return matchesSearch; // Only right side remains

    return matchesSearch;
  });

  const copyReferralLink = () => {
    if (user) {
      const link = `${window.location.origin}/register?ref=${user.referral_code}`;
      navigator.clipboard.writeText(link);
      alert(`Referral link copied to clipboard!`);
    }
  };
  const shareReferralLink = () => {
    if (user) {
      const link = `${window.location.origin}/register?ref=${user.referral_code}`;
      if (navigator.share) {
        navigator.share({
          title: `Join GrowwPark MLM Platform`,
          text: "Join me on GrowwPark and start earning with GPK Coin!",
          url: link,
        });
      } else {
        copyReferralLink();
      }
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
          <p className="text-gray-600">Manage your referral network and binary tree</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTree(!showTree)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>{showTree ? "Hide Tree" : "View Tree"}</span>
          </button>
        </div>
      </div>

      {/* Current User Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold mb-2">You</h2>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-2xl">{user.name.charAt(0)}</span>
          </div>
          <div>
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
            <div className="text-gray-500">GPK ID: {user.gpk_id}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Direct Referrals</p>
              <p className="text-2xl font-bold text-purple-600">{referrals.length}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold">R</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Links */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">Referral Link</span>
            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">R</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
            {`${window.location.origin}/register?ref=${user.referral_code}`}
              </div>
              <div className="flex space-x-2">
                <button
              onClick={copyReferralLink}
                  className="flex items-center space-x-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
                <button
              onClick={shareReferralLink}
                  className="flex items-center space-x-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition-colors"
                >
                  <Share2 className="h-3 w-3" />
                  <span>Share</span>
                </button>
              </div>
        </div>
      </div>

      {/* Tree Visualization */}
      {showTree && <BinaryTreeVisualization rootUser={user} maxLevels={4} />}

      {/* Direct Referrals Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Direct Referrals</h3>
            <div className="flex space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search referrals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="right">Referrel Link</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPK ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReferrals.map((referral, idx) => (
                <tr key={referral.id || idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {referral.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {referral.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {referral.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{referral.gpk_id}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800`}
                    >
                      Referrel
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        referral.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {referral.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {referral.join_date ? new Date(referral.join_date).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {referral.package_id ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReferrals.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start sharing your referral links to build your team.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Referrals;
