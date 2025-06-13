import React, { useState, useEffect } from "react";
import { Card, Table, Button, Typography, Divider, message } from "antd";
import { supabase } from "./supabase";

const { Title, Text } = Typography;

// 台灣時區 yyyy-MM-dd
function getTaiwanDateString() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const taiwanTime = new Date(utc + (8 * 60 * 60 * 1000));
  const yyyy = taiwanTime.getUTCFullYear();
  const mm = String(taiwanTime.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(taiwanTime.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const MAX_GROUP_SIZE = 6;

// 幫 copy text 同名合併 (名字(數量))
function compressNames(members) {
  const counter = {};
  members.forEach(m => {
    counter[m.name] = (counter[m.name] || 0) + 1;
  });
  return Object.entries(counter)
    .map(([name, count]) => count > 1 ? `${name}(${count})` : name)
    .join("、");
}

// 合併所有角色名與報名數，換行格式
function mergeAllNames(allGroups) {
  const totalCounter = {};
  allGroups.forEach(g => {
    g.members.forEach(m => {
      totalCounter[m.name] = (totalCounter[m.name] || 0) + 1;
    });
  });
  // 格式化
  return Object.entries(totalCounter)
    .map(([name, count]) => count > 1 ? `${name}(${count})` : name)
    .join('\n');
}

const ManagementView = () => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [copyText, setCopyText] = useState("");
  const todayStr = getTaiwanDateString();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. 取今日 signups 全部
      const { data: signupsRaw, error: error1 } = await supabase
        .from("signups")
        .select("name, battle_count, is_self_team, applied_date, status")
        .eq("applied_date", todayStr)
        .eq("status", "N");

      if (error1) {
        message.error("讀取報名資料失敗：" + error1.message);
        setLoading(false);
        return;
      }

      // 2. 取 members 名單
      const { data: membersRaw, error: error2 } = await supabase
        .from("members")
        .select("name, team_main");

      if (error2) {
        message.error("讀取角色資料失敗：" + error2.message);
        setLoading(false);
        return;
      }

      // 3. 前端 join: 合併 team_main
      const membersMap = {};
      membersRaw.forEach(m => membersMap[m.name] = m.team_main);

      const merged = signupsRaw.map(s => ({
        ...s,
        team: membersMap[s.name] || null, // 用 null 區分
      }));

      // === 分成需排組、自己一組 ===
      const toGroup = merged.filter(s => !s.is_self_team);
      const selfGroup = merged.filter(s => s.is_self_team);

      // 先分有隊伍和沒隊伍的
      const hasTeam = toGroup.filter(s => !!s.team);
      const noTeam = toGroup.filter(s => !s.team);

      // 將 hasTeam 按隊伍分組，每人展開為 slot
      const byTeam = {};
      hasTeam.forEach((s) => {
        const team = s.team;
        if (!byTeam[team]) byTeam[team] = [];
        byTeam[team].push(s);
      });

      // 展開 slot
      let teamSlots = [];
      Object.entries(byTeam).forEach(([team, arr]) => {
        let slots = [];
        arr.forEach((s) => {
          for (let i = 0; i < s.battle_count; i++) {
            slots.push({ ...s, slotNo: i + 1, team });
          }
        });
        teamSlots.push({ team, slots });
      });

      // 把所有隊伍排成一個大 slot list（每組 6 個 slot）
      let grouped = [];
      teamSlots.forEach(teamObj => {
        let { team, slots } = teamObj;
        let idx = 0;
        while (idx < slots.length) {
          const thisGroup = slots.slice(idx, idx + MAX_GROUP_SIZE);
          grouped.push({
            team,
            members: [...thisGroup], // 先不補人
            isSelf: false
          });
          idx += MAX_GROUP_SIZE;
        }
      });

      // 展開無隊伍 slot
      let noTeamSlots = [];
      noTeam.forEach(s => {
        for (let i = 0; i < s.battle_count; i++) {
          noTeamSlots.push({ ...s, slotNo: i + 1, team: "無隊伍" });
        }
      });

      // === 重點：補進空組 ===
      for (let i = 0; i < grouped.length; i++) {
        const group = grouped[i];
        while (group.members.length < MAX_GROUP_SIZE && noTeamSlots.length > 0) {
          group.members.push(noTeamSlots.shift());
        }
      }

      // 補完後，如果還有沒補進去的，自己成新組
      let idx = 0;
      while (idx < noTeamSlots.length) {
        const thisGroup = noTeamSlots.slice(idx, idx + MAX_GROUP_SIZE);
        grouped.push({
          team: "無隊伍",
          members: thisGroup,
          isSelf: false
        });
        idx += MAX_GROUP_SIZE;
      }

      // 5. 將自己組隊的排到最後，每人一組，組員數依 battle_count
      selfGroup.forEach((s) => {
        const members = [];
        for (let i = 0; i < s.battle_count; i++) {
          members.push(s); // 每 slot 都填自己
        }
        grouped.push({
          team: s.team || "無隊伍",
          members,
          isSelf: true,
          name: s.name
        });
      });

      setGroups(grouped);

      // 6. 組複製字串
      let copyStr = "";
      grouped.forEach((g, i) => {
        if (g.isSelf) {
          copyStr += `第${i + 1}組（自己組隊：${g.name}）：\n  `;
          copyStr += compressNames(g.members);
          copyStr += "\n";
        } else {
          if (g.team && g.team !== "無隊伍") {
            copyStr += `第${i + 1}組（${g.team}）：\n  `;
          } else {
            copyStr += `第${i + 1}組（無隊伍）：\n  `;
          }
          copyStr += compressNames(g.members);
          copyStr += "\n";
        }
      });
      setCopyText(copyStr);

      setLoading(false);
    };
    fetchData();
  }, []);

  // 複製文字到剪貼簿
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      message.success("已複製到剪貼簿！");
    } catch {
      message.error("複製失敗，請手動選取。");
    }
  };

  // 匯出CSV
  const handleExportCSV = () => {
    const header = "組別,隊伍,角色,第幾位,報名數,是否自己組隊\n";
    let csv = header;
    let groupIdx = 1;
    groups.forEach((g) => {
      g.members.forEach((m, j) => {
        csv += `${groupIdx},${g.isSelf ? "自己組隊" : g.team},${m.name},${j + 1},${m.battle_count},${g.isSelf ? "Y" : ""}\n`;
      });
      groupIdx++;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `國戰排組_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 匯出角色名總數 txt
  const handleExportNameCounts = () => {
    const text = mergeAllNames(groups);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `角色報名數列表_${todayStr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 780, margin: "36px auto" }}>
      <Card
        title={<Title level={3}>今日報名排組管理（{todayStr}）</Title>}
        extra={
          <>
            <Button onClick={handleCopy} style={{ marginRight: 12 }}>複製純文字</Button>
            <Button onClick={handleExportCSV} style={{ marginRight: 12 }} type="primary">匯出CSV</Button>
            <Button onClick={handleExportNameCounts} type="dashed">匯出角色名總數</Button>
          </>
        }
        loading={loading}
        bodyStyle={{ minHeight: 480 }}
      >
        {groups.length === 0 ? (
          <Text type="secondary">今日暫無需要排組的報名。</Text>
        ) : (
          <>
            {groups.map((g, i) => (
              <div key={i} style={{
                marginBottom: 28,
                borderRadius: 14,
                border: "1.5px solid #ffe082",
                background: "#fffde7",
                padding: 18,
                boxShadow: "0 2px 8px #ffecb333"
              }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#d84315" }}>
                  {g.isSelf
                    ? `第${i + 1}組（自己組隊：${g.name}）`
                    : `第${i + 1}組（${g.team}）`
                  }
                  <span style={{ color: "#888", fontWeight: 400, fontSize: 15, marginLeft: 12 }}>
                    人數：{g.members.length}
                  </span>
                </div>
                <Divider style={{ margin: "8px 0 10px" }} />
                <Table
                  dataSource={g.members.map((m, idx) => ({
                    key: idx,
                    name: m.name,
                    slot: idx + 1,
                    battle_count: m.battle_count,
                  }))}
                  columns={[
                    { title: "序", dataIndex: "slot", width: 60 },
                    { title: "角色", dataIndex: "name", width: 130 },
                    { title: "該角色報名數", dataIndex: "battle_count", width: 120 },
                  ]}
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 6 }}
                />
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  );
};

export default ManagementView;
